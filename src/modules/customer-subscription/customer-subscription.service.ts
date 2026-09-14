import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';
import { Cron } from '@nestjs/schedule';

import { StorageService } from '../../services/storage/storage.service';

@Injectable()
export class CustomerSubscriptionService {
  private readonly logger = new Logger(CustomerSubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async getVehiclesAndPlans(customerId: number) {
    // 1. Fetch customer vehicles
    const vehicles = await this.prisma.customer_vehicle.findMany({
      where: { customer_id: customerId, is_deleted: false },
      include: {
        subscriptions: {
          where: {
            is_active: true,
            status: {
              in: ['PendingActivation', 'Active'],
            },
          },
        },
      },
    });

    // 2. Fetch all active subscription plans
    const allPlans = await this.prisma.subscription_plan.findMany({
      where: { is_active: true },
    });

    // 3. Map vehicles to their available plans
    const vehiclesWithPlans = vehicles.map((vehicle) => {
      const activeSubscription =
        vehicle.subscriptions.length > 0 ? vehicle.subscriptions[0] : null;

      const availablePlans = allPlans.filter(
        (plan) => plan.vehicle_type === vehicle.vehicle_type,
      );

      return {
        vehicle: {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          registration_number: vehicle.registration_number,
          vehicle_type: vehicle.vehicle_type,
        },
        current_subscription: activeSubscription,
        available_plans: availablePlans,
      };
    });

    return vehiclesWithPlans;
  }

  async purchaseSubscription(
    customerId: number,
    dto: PurchaseSubscriptionDto,
    rcBooks: Express.Multer.File[],
  ) {
    if (!dto.vehicles || dto.vehicles.length === 0) {
      throw new BadRequestException(
        'At least one vehicle subscription must be selected.',
      );
    }

    if (!rcBooks || rcBooks.length !== dto.vehicles.length) {
      throw new BadRequestException(
        `You must provide exactly one RC book file for each selected vehicle. Expected ${dto.vehicles.length}, got ${rcBooks?.length || 0}`,
      );
    }

    // Upload RC books first
    const uploadedRcBookUrls: string[] = [];
    for (const file of rcBooks) {
      const uploadResult = await this.storageService.uploadFileAsync({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        folderPath: 'subscriptions/rc_books',
      });
      uploadedRcBookUrls.push(uploadResult.url);
    }

    return await this.prisma.$transaction(async (prisma) => {
      let totalAmount = 0;
      const vehicleSubscriptionsToCreate: any[] = [];
      let index = 0;

      for (const item of dto.vehicles) {
        const rc_book_url = uploadedRcBookUrls[index];
        index++;
        // 1. Validate vehicle exists and belongs to customer
        const vehicle = await prisma.customer_vehicle.findFirst({
          where: {
            id: item.customer_vehicle_id,
            customer_id: customerId,
            is_deleted: false,
          },
        });

        if (!vehicle) {
          throw new BadRequestException(
            `Vehicle with ID ${item.customer_vehicle_id} not found or does not belong to you.`,
          );
        }

        // 2. Deactivate any existing active/pending subscriptions for this vehicle
        // (This allows a customer to purchase a new subscription which overrides the old one)
        await prisma.customer_vehicle_subscription.updateMany({
          where: {
            customer_vehicle_id: item.customer_vehicle_id,
            is_active: true,
          },
          data: {
            is_active: false,
          },
        });

        // 3. Validate plan exists and matches vehicle type
        const plan = await prisma.subscription_plan.findUnique({
          where: { id: item.subscription_plan_id },
        });

        if (!plan || !plan.is_active) {
          throw new BadRequestException(
            `Plan with ID ${item.subscription_plan_id} not found or is inactive.`,
          );
        }

        if (plan.vehicle_type !== vehicle.vehicle_type) {
          throw new BadRequestException(
            `Plan vehicle type (${plan.vehicle_type}) does not match your vehicle type (${vehicle.vehicle_type}).`,
          );
        }

        // Calculate starts_at based on delay
        const startsAt = new Date();
        startsAt.setDate(startsAt.getDate() + plan.activation_delay_days);

        const expiresAt = new Date(startsAt);
        expiresAt.setMonth(expiresAt.getMonth() + plan.plan_period_months);

        totalAmount += plan.pricing;

        vehicleSubscriptionsToCreate.push({
          customer_id: customerId,
          customer_vehicle_id: item.customer_vehicle_id,
          subscription_plan_id: plan.id,
          rc_book_url: rc_book_url,
          plan_name: plan.name,
          plan_pricing: plan.pricing,
          plan_period_months: plan.plan_period_months,
          total_incidents_allowed: plan.incidents,
          distance_km_allowed: plan.distance_km,
          vehicle_type: plan.vehicle_type,
          starts_at: startsAt,
          expires_at: expiresAt,
          status: 'PendingActivation',
          is_active: true,
        });
      }

      // 4. Create the Purchase record
      const purchase = await prisma.customer_subscription_purchase.create({
        data: {
          customer_id: customerId,
          total_amount: totalAmount,
          status: 'Completed', // Simulating successful payment
        },
      });

      // 5. Create the individual subscriptions
      const createdSubscriptions: any[] = [];
      for (const sub of vehicleSubscriptionsToCreate) {
        const created = await prisma.customer_vehicle_subscription.create({
          data: {
            ...sub,
            purchase_id: purchase.id,
          },
        });
        createdSubscriptions.push(created);
      }

      return {
        purchase,
        subscriptions: createdSubscriptions,
      };
    });
  }

  async getPendingManualActivation() {
    const now = new Date();
    return this.prisma.customer_vehicle_subscription.findMany({
      where: {
        status: 'PendingActivation',
        starts_at: {
          lte: now,
        },
      },
      include: {
        customer: { select: { full_name: true, number: true } },
        customer_vehicle: true,
      },
    });
  }

  @Cron('0 */12 * * *') // Runs every 12 hours
  async handleSubscriptionActivationCron() {
    this.logger.debug('Running subscription activation cron job...');
    const now = new Date();

    try {
      // 1. Activate due subscriptions
      const activated =
        await this.prisma.customer_vehicle_subscription.updateMany({
          where: {
            status: 'PendingActivation',
            starts_at: {
              lte: now,
            },
          },
          data: {
            status: 'Active',
          },
        });

      if (activated.count > 0) {
        this.logger.log(
          `Successfully activated ${activated.count} subscriptions.`,
        );
      }

      // 2. Expire outdated subscriptions
      const expired =
        await this.prisma.customer_vehicle_subscription.updateMany({
          where: {
            status: {
              in: ['Active', 'PendingActivation'],
            },
            expires_at: {
              lte: now,
            },
          },
          data: {
            status: 'Expired',
            is_active: false,
          },
        });

      if (expired.count > 0) {
        this.logger.log(`Successfully expired ${expired.count} subscriptions.`);
      }
    } catch (error) {
      this.logger.error('Error running subscription cron jobs', error);
    }
  }
}
