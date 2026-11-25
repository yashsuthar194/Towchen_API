import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { StorageService } from 'src/services/storage/storage.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { MapsService } from 'src/services/maps/maps.service';
import { CreateAdminPackageOrderDto } from './dto/create-admin-package-order.dto';
import { AdminPackageOrderQueryDto } from './dto/admin-package-order-query.dto';
import { RescheduleAdminPackageOrderDto } from './dto/cancel-admin-package-order.dto';
import { ReassignOrderDriverDto } from '../order/dto/reassign-order-driver.dto';
import { DispatchType, OrderStatus, Prisma } from '@prisma/client';

/** Minimum minutes in advance a booking must be scheduled (2 hours minimum advance notice) */
const MIN_SCHEDULE_ADVANCE_MINUTES = 120;

/** Checks if extra services list includes Cab service */
export function hasCabService(services?: string[]): boolean {
  if (!services || !services.length) return false;
  return services.some((s) => typeof s === 'string' && s.trim().toLowerCase() === 'cab');
}

/** Checks if extra services list includes Hotel Accommodation service */
export function hasHotelService(services?: string[]): boolean {
  if (!services || !services.length) return false;
  return services.some((s) => {
    if (typeof s !== 'string') return false;
    const lower = s.trim().toLowerCase();
    return (
      lower.includes('hotel') ||
      lower === 'hotel accomodation' ||
      lower === 'hotel accommodation'
    );
  });
}

@Injectable()
export class AdminPackageOrderService {
  private readonly logger = new Logger(AdminPackageOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly dispatchService: DispatchService,
    private readonly mapsService: MapsService,
  ) {}

  /**
   * Creates a new admin package order, handling both immediate and scheduled dispatches.
   * Atomically decrements 1 incident from the customer's package (plus cab and hotel if selected).
   */
  async createOrderAsync(
    dto: CreateAdminPackageOrderDto,
    files: Express.Multer.File[] = [],
    adminId?: number,
  ) {
    // 1. Resolve & Validate Dealer Package Order (Contract)
    const packageOrderId =
      dto.tp_membership_id ||
      (dto as any).dealer_package_order_id ||
      (dto as any).membership_id;

    if (!packageOrderId) {
      throw new BadRequestException(
        'Field tp_membership_id (or dealer_package_order_id) is required.',
      );
    }

    const packageOrder = await this.prisma.dealer_package_order.findUnique({
      where: { id: packageOrderId },
      include: {
        dealer: { select: { id: true, name: true, is_deleted: true } },
      },
    });

    if (!packageOrder) {
      throw new NotFoundException(
        `Dealer package order #${packageOrderId} was not found.`,
      );
    }

    if (packageOrder.status !== 'Active') {
      throw new BadRequestException(
        `Cannot create order: Package #${packageOrderId} status is '${packageOrder.status}'. Only Active packages can be serviced.`,
      );
    }

    const now = new Date();
    if (now > new Date(packageOrder.expiry_date)) {
      throw new BadRequestException(
        `Cannot create order: Package #${packageOrderId} expired on ${packageOrder.expiry_date.toISOString().split('T')[0]}.`,
      );
    }

    // 2. Incident Count Pre-Check: Service incidents
    if (packageOrder.incidents_used >= packageOrder.incidents_allowed) {
      throw new BadRequestException(
        `Cannot create order: All ${packageOrder.incidents_allowed} package service incidents have already been used for Membership #${packageOrder.formated_id || packageOrder.order_number}.`,
      );
    }

    // 2b. Extra Services Pre-Check (Cab & Hotel Accommodation)
    const extraServices = dto.extra_services || [];
    const includesCab = hasCabService(extraServices);
    const includesHotel = hasHotelService(extraServices);

    if (includesCab) {
      const cabRemaining = packageOrder.cab_service_allowed - packageOrder.cab_service_used;
      if (cabRemaining <= 0) {
        throw new BadRequestException(
          `Cannot create order with Cab service: All ${packageOrder.cab_service_allowed} Cab incidents have already been used for Membership #${packageOrder.formated_id || packageOrder.order_number}.`,
        );
      }
    }

    if (includesHotel) {
      const hotelRemaining =
        packageOrder.hotel_accommodation_allowed - packageOrder.hotel_accommodation_used;
      if (hotelRemaining <= 0) {
        throw new BadRequestException(
          `Cannot create order with Hotel Accommodation: All ${packageOrder.hotel_accommodation_allowed} Hotel Accommodation incidents have already been used for Membership #${packageOrder.formated_id || packageOrder.order_number}.`,
        );
      }
    }

    // 3. Validate Scheduled Activation Time (All package orders are strictly scheduled)
    if (!dto.activation_time) {
      throw new BadRequestException('Field activation_time is required.');
    }
    const parsedActivationTime = new Date(dto.activation_time);
    if (isNaN(parsedActivationTime.getTime())) {
      throw new BadRequestException('Invalid activation_time format.');
    }

    // Minimum advance notice: 2 hours (120 minutes)
    const minAllowedTime = Date.now() + MIN_SCHEDULE_ADVANCE_MINUTES * 60 * 1000;
    if (parsedActivationTime.getTime() < minAllowedTime) {
      throw new BadRequestException(
        `Scheduled activation_time must be at least ${MIN_SCHEDULE_ADVANCE_MINUTES} minutes (2 hours) in the future.`,
      );
    }

    // Cannot schedule beyond package expiration date
    if (parsedActivationTime > new Date(packageOrder.expiry_date)) {
      throw new BadRequestException(
        `Cannot schedule order beyond package expiry date (${packageOrder.expiry_date.toISOString().split('T')[0]}).`,
      );
    }

    const initialStatus: OrderStatus = OrderStatus.Scheduled;

    // Upfront driver & vendor assignment for scheduled orders
    if (dto.driver_id) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: dto.driver_id },
        include: { vendor: true },
      });
      if (!driver || driver.is_deleted) {
        throw new NotFoundException(`Driver #${dto.driver_id} was not found or is inactive.`);
      }
      if (dto.vendor_id && driver.vendor_id !== dto.vendor_id) {
        throw new BadRequestException(
          `Driver #${dto.driver_id} does not belong to Vendor #${dto.vendor_id}.`,
        );
      }
      dto.vendor_id = driver.vendor_id;
      dto.assigned_vehicle_id = (dto.assigned_vehicle_id || driver.vehicle_id) ?? undefined;

      const hasConflict = await this.dispatchService.hasDriverScheduleConflictAsync(
        dto.driver_id,
        parsedActivationTime,
      );
      if (hasConflict) {
        throw new BadRequestException(
          `Driver #${dto.driver_id} (${driver.driver_name}) is already assigned to another scheduled order or blackout window at that time.`,
        );
      }
    } else {
      // System auto-assignment
      let pickupLat = dto.pickup_latitude;
      let pickupLng = dto.pickup_longitude;
      if ((!pickupLat || !pickupLng) && dto.pickup_place_id) {
        const resolved = await this.mapsService.resolveAddressByPlaceIdAsync(
          dto.pickup_place_id,
        );
        pickupLat = resolved.latitude;
        pickupLng = resolved.longitude;
      }

      if (!pickupLat || !pickupLng) {
        throw new BadRequestException(
          'Pickup location coordinates or pickup_place_id are required to auto-assign a scheduled driver.',
        );
      }

      const autoAssign = await this.dispatchService.autoAssignScheduledDriverAsync({
        breakdownLat: pickupLat,
        breakdownLng: pickupLng,
        subServiceId: dto.sub_service_id,
        scheduledAt: parsedActivationTime,
      });

      dto.vendor_id = autoAssign.vendorId;
      dto.driver_id = autoAssign.driverId;
      dto.assigned_vehicle_id = (dto.assigned_vehicle_id || autoAssign.vehicleId) ?? undefined;
    }

    let parsedEta: Date | null = null;
    if (dto.eta) {
      parsedEta = new Date(dto.eta);
      if (isNaN(parsedEta.getTime())) {
        parsedEta = null;
      }
    }

    // 4. Validate Sub-Service & FourWay / ThreeWay Journey
    const subService = await this.prisma.sub_service.findUnique({
      where: { id: dto.sub_service_id },
    });
    if (!subService) {
      throw new NotFoundException(`Sub-service #${dto.sub_service_id} was not found.`);
    }

    const isFourWay = subService.journey_type === 'FourWay';
    if (isFourWay && !dto.drop_place_id && !dto.drop_location_address) {
      throw new BadRequestException(
        'Drop location (drop_place_id or drop_location_address) is mandatory for FourWay journey sub-services.',
      );
    }

    // 5. Upload multiple vehicle condition/intake images
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await Promise.all(
        files.map((file, index) =>
          this.storageService
            .uploadFileAsync({
              buffer: file.buffer,
              originalName: `intake_${Date.now()}_${index}_${file.originalname}`,
              mimeType: file.mimetype,
              size: file.size,
              folderPath: 'admin_package_order/intake',
            })
            .then((res) => res.url),
        ),
      );
    }

    // Resolve client_id, customer, vehicle registration, and problem
    const dealerId = dto.client_id || packageOrder.dealer_id;
    const dealerCustomerId = dto.dealer_customer_id || packageOrder.dealer_customer_id;
    const customerName = dto.customer.trim();
    const customerNumber = dto.customer_number.trim();
    const customerAltNumber = dto.customer_alternate_number?.trim() || null;
    const vehicleRegNumber = dto.vehicle_registration_number.trim().toUpperCase();
    const vehicleProblem = dto.vehicle_problem?.trim() || null;

    // 6. Database Transaction: Atomic Incident Decrement + Order Insertion
    const createdOrder = await this.prisma.$transaction(async (tx) => {
      // Concurrency-guarded incident decrement
      const packageWhere: Prisma.dealer_package_orderWhereInput = {
        id: packageOrder.id,
        incidents_used: { lt: packageOrder.incidents_allowed },
      };

      const packageDataUpdate: Prisma.dealer_package_orderUpdateManyMutationInput = {
        incidents_used: { increment: 1 },
      };

      if (includesCab) {
        packageWhere.cab_service_used = { lt: packageOrder.cab_service_allowed };
        packageDataUpdate.cab_service_used = { increment: 1 };
      }

      if (includesHotel) {
        packageWhere.hotel_accommodation_used = {
          lt: packageOrder.hotel_accommodation_allowed,
        };
        packageDataUpdate.hotel_accommodation_used = { increment: 1 };
      }

      const updatedPackage = await tx.dealer_package_order.updateMany({
        where: packageWhere,
        data: packageDataUpdate,
      });

      if (updatedPackage.count === 0) {
        throw new BadRequestException(
          'Failed to reserve package incidents (service, cab, or hotel may have been exhausted by another concurrent order). Please refresh and try again.',
        );
      }

      // Generate sequential Formatted ID (APO0000001)
      const lastOrder = await tx.admin_package_order.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      const nextId = (lastOrder?.id ?? 0) + 1;
      let formatedId = `APO${String(nextId).padStart(7, '0')}`;
      const existing = await tx.admin_package_order.findUnique({
        where: { formated_id: formatedId },
      });
      if (existing) {
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        formatedId = `APO${String(nextId).padStart(4, '0')}${randomPart}`;
      }

      // Create Admin Package Order
      const newOrder = await tx.admin_package_order.create({
        data: {
          formated_id: formatedId,
          order_type: dto.order_type,
          sub_service_id: dto.sub_service_id,
          dispatch_type: DispatchType.ScheduledLater,
          activation_time: parsedActivationTime,
          eta: parsedEta,
          client_type: dto.client_type,
          dealer_id: dealerId,
          dealer_package_order_id: packageOrderId,
          dealer_customer_id: dealerCustomerId,
          customer_name: customerName,
          customer_number: customerNumber,
          customer_alternate_number: customerAltNumber,
          vehicle_id: dto.vehicle_id || null,
          vehicle_make: dto.vehicle_make.trim(),
          vehicle_model: dto.vehicle_model.trim(),
          vehicle_variant: dto.vehicle_variant?.trim() || null,
          vehicle_fuel_type: dto.vehicle_fuel_type,
          vehicle_body_type: dto.vehicle_body_type?.trim() || null,
          vehicle_reg_number: vehicleRegNumber,
          vehicle_chassis_number: dto.vehicle_chassis_number.trim().toUpperCase(),
          vehicle_current_status: dto.vehicle_current_status,
          images: imageUrls,
          extra_services: extraServices,
          pickup_location_address: dto.pickup_location_address?.trim() || null,
          pickup_latitude: dto.pickup_latitude || null,
          pickup_longitude: dto.pickup_longitude || null,
          pickup_place_id: dto.pickup_place_id?.trim() || null,
          drop_location_address: dto.drop_location_address?.trim() || null,
          drop_latitude: dto.drop_latitude || null,
          drop_longitude: dto.drop_longitude || null,
          drop_place_id: dto.drop_place_id?.trim() || null,
          vendor_id: dto.vendor_id || null,
          driver_id: dto.driver_id || null,
          assigned_vehicle_id: dto.assigned_vehicle_id || null,
          assign_time: dto.driver_id || dto.vendor_id ? new Date() : null,
          remarks: vehicleProblem,
          status: initialStatus,
          created_by_id: adminId || null,
        },
        include: {
          dealer: {
            select: { id: true, formated_id: true, name: true, number: true },
          },
          dealer_package_order: {
            select: {
              id: true,
              formated_id: true,
              order_number: true,
              plan_name: true,
              incidents_allowed: true,
              incidents_used: true,
            },
          },
          sub_service: {
            select: { id: true, name: true, journey_type: true },
          },
        },
      });

      return newOrder;
    });

    this.logger.log(
      `Admin package order #${createdOrder.id} (${createdOrder.formated_id}) created with status '${createdOrder.status}' for Dealer #${dealerId}, Contract #${packageOrderId}.`,
    );

    return this.formatOrderResponse(createdOrder);
  }

  // ─── Automated Scheduled Activation Cron (Worker) ─────────────────────────

  /**
   * Background processor running every minute to activate due scheduled package orders.
   * Atomically claims due rows (status: Scheduled -> New) to prevent race conditions in multi-instance setups.
   * Also verifies package contract status at activation time.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async activateDueScheduledOrders(): Promise<void> {
    const now = new Date();

    const dueOrders = await this.prisma.admin_package_order.findMany({
      where: {
        status: OrderStatus.Scheduled,
        dispatch_type: DispatchType.ScheduledLater,
        activation_time: { lte: now },
      },
      include: {
        dealer_package_order: {
          select: {
            id: true,
            formated_id: true,
            status: true,
            expiry_date: true,
          },
        },
      },
    });

    if (dueOrders.length === 0) return;

    this.logger.log(`Found ${dueOrders.length} due scheduled package order(s) for activation.`);

    for (const order of dueOrders) {
      // Edge Case: Has the underlying package contract expired or been suspended since booking?
      const pkg = order.dealer_package_order;
      if (pkg.status !== 'Active' || new Date(pkg.expiry_date) < now) {
        this.logger.warn(
          `Cannot activate Scheduled Order #${order.id} (${order.formated_id}): Underlying Package #${pkg.id} (${pkg.formated_id}) is ${pkg.status} or expired on ${pkg.expiry_date.toISOString().split('T')[0]}.`,
        );
        // Leave in Scheduled or mark with admin alert remarks rather than silently failing
        await this.prisma.admin_package_order.update({
          where: { id: order.id },
          data: {
            remarks: `${order.remarks ? order.remarks + ' | ' : ''}Activation Hold: Package contract is ${pkg.status} or expired.`,
          },
        });
        continue;
      }

      // Atomic claim to transition Scheduled -> Assigned (Driver already pre-assigned)
      const claimed = await this.prisma.admin_package_order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.Scheduled,
        },
        data: {
          status: OrderStatus.Assigned,
        },
      });

      if (claimed.count === 1) {
        this.logger.log(
          `Scheduled package order #${order.id} (${order.formated_id}) has been ACTIVATED (Status: Assigned) at ${now.toISOString()}. Driver #${order.driver_id} is active.`,
        );
      }
    }
  }

  // ─── Order Cancellation & Incident Refund ──────────────────────────────────

  /**
   * Cancels an order before it has been dispatched/started, and refunds the consumed incident.
   */
  async cancelOrderAsync(id: number, reason: string, adminId?: number) {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new BadRequestException('A valid cancellation reason must be provided.');
    }

    const order = await this.prisma.admin_package_order.findUnique({
      where: { id },
      include: { dealer_package_order: true },
    });

    if (!order) {
      throw new NotFoundException(`Admin package order #${id} was not found.`);
    }

    if (order.status !== OrderStatus.Scheduled && order.status !== OrderStatus.New) {
      throw new BadRequestException(
        `Cannot cancel an order in status '${order.status}'. Only Scheduled or New orders can be cancelled.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark order as Cancelled atomically
      const updatedOrder = await tx.admin_package_order.update({
        where: { id },
        data: {
          status: OrderStatus.Cancelled,
          cancel_reason: trimmedReason,
        },
      });

      // 2. Prepare refund payload
      const orderRefundCab = hasCabService(order.extra_services);
      const orderRefundHotel = hasHotelService(order.extra_services);

      const refundData: Prisma.dealer_package_orderUpdateInput = {
        incidents_used: {
          decrement: order.dealer_package_order.incidents_used > 0 ? 1 : 0,
        },
      };

      if (orderRefundCab && order.dealer_package_order.cab_service_used > 0) {
        refundData.cab_service_used = { decrement: 1 };
      }

      if (orderRefundHotel && order.dealer_package_order.hotel_accommodation_used > 0) {
        refundData.hotel_accommodation_used = { decrement: 1 };
      }

      // 3. Refund incidents on dealer_package_order
      await tx.dealer_package_order.update({
        where: { id: order.dealer_package_order_id },
        data: refundData,
      });

      this.logger.log(
        `Order #${id} (${order.formated_id}) cancelled by admin. Service incident refunded` +
          `${orderRefundCab ? ' + Cab incident refunded' : ''}` +
          `${orderRefundHotel ? ' + Hotel incident refunded' : ''}` +
          ` to Package #${order.dealer_package_order_id}.`,
      );

      return this.formatOrderResponse(updatedOrder);
    });
  }

  // ─── Order Rescheduling ────────────────────────────────────────────────────

  /**
   * Reschedules the activation time of a pending Scheduled order.
   */
  async rescheduleOrderAsync(
    id: number,
    dto: RescheduleAdminPackageOrderDto,
    adminId?: number,
  ) {
    const order = await this.prisma.admin_package_order.findUnique({
      where: { id },
      include: { dealer_package_order: true },
    });

    if (!order) {
      throw new NotFoundException(`Admin package order #${id} was not found.`);
    }

    if (order.status !== OrderStatus.Scheduled) {
      throw new BadRequestException(
        `Cannot reschedule order #${id}. Only orders in 'Scheduled' status can be rescheduled (current status: '${order.status}').`,
      );
    }

    const newActivation = new Date(dto.activation_time);
    if (isNaN(newActivation.getTime())) {
      throw new BadRequestException('Invalid activation_time format.');
    }

    if (newActivation.getTime() < Date.now() + MIN_SCHEDULE_ADVANCE_MINUTES * 60 * 1000) {
      throw new BadRequestException(
        `Rescheduled activation_time must be at least ${MIN_SCHEDULE_ADVANCE_MINUTES} minutes (2 hours) in the future.`,
      );
    }

    if (newActivation > new Date(order.dealer_package_order.expiry_date)) {
      throw new BadRequestException(
        `Cannot reschedule beyond package expiry date (${order.dealer_package_order.expiry_date.toISOString().split('T')[0]}).`,
      );
    }

    let newEta: Date | null = null;
    if (dto.eta) {
      newEta = new Date(dto.eta);
      if (isNaN(newEta.getTime())) newEta = null;
    }

    const updated = await this.prisma.admin_package_order.update({
      where: { id },
      data: {
        activation_time: newActivation,
        eta: newEta,
        remarks: dto.remarks
          ? `${order.remarks ? order.remarks + ' | ' : ''}Rescheduled: ${dto.remarks}`
          : order.remarks,
      },
    });

    this.logger.log(
      `Order #${id} (${order.formated_id}) rescheduled to ${newActivation.toISOString()}`,
    );

    return this.formatOrderResponse(updated);
  }

  /**
   * Manually re-assigns vendor and driver for an admin package order.
   * Enforces vendor-driver relationship and schedule conflict checks.
   */
  async reassignDriverAsync(
    id: number,
    dto: ReassignOrderDriverDto,
    adminId?: number,
  ) {
    const order = await this.prisma.admin_package_order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Admin package order #${id} was not found.`);
    }

    const allowedStatuses: OrderStatus[] = [OrderStatus.Scheduled, OrderStatus.Assigned, OrderStatus.New];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Cannot reassign order #${id}. Only orders in Scheduled, Assigned, or New status can be reassigned (current status: '${order.status}').`,
      );
    }

    const driver = await this.prisma.driver.findUnique({
      where: { id: dto.driver_id },
      include: { vendor: true, vehicle: true },
    });

    if (!driver || driver.is_deleted) {
      throw new NotFoundException(`Driver #${dto.driver_id} was not found or is inactive.`);
    }

    const vendorId = dto.vendor_id || driver.vendor_id;
    if (dto.vendor_id && driver.vendor_id !== dto.vendor_id) {
      throw new BadRequestException(
        `Driver #${dto.driver_id} does not belong to Vendor #${dto.vendor_id}.`,
      );
    }

    const targetTime = order.activation_time || order.assign_time || new Date();
    const hasConflict = await this.dispatchService.hasDriverScheduleConflictAsync(
      dto.driver_id,
      targetTime,
      60,
      { adminPackageOrderId: id },
    );

    if (hasConflict) {
      throw new BadRequestException(
        `Driver #${dto.driver_id} (${driver.driver_name}) is already assigned to another scheduled order or blackout window at that time.`,
      );
    }

    // Automatically resolve vehicle from driver's assigned vehicle if not explicitly supplied
    let vehicleId = dto.vehicle_id || driver.vehicle_id || driver.vehicle?.id || null;
    if (!vehicleId) {
      const vendorVehicle = await this.prisma.vehicle.findFirst({
        where: { vendor_id: vendorId },
        select: { id: true },
      });
      if (vendorVehicle) vehicleId = vendorVehicle.id;
    }

    const auditRemark = dto.reason
      ? `Reassigned by Admin${adminId ? ` #${adminId}` : ''}: ${dto.reason}`
      : `Reassigned by Admin${adminId ? ` #${adminId}` : ''} to Driver #${dto.driver_id}`;

    const updated = await this.prisma.admin_package_order.update({
      where: { id },
      data: {
        vendor_id: vendorId,
        driver_id: dto.driver_id,
        assigned_vehicle_id: vehicleId,
        assign_time: new Date(),
        remarks: order.remarks ? `${order.remarks} | ${auditRemark}` : auditRemark,
      },
      include: {
        dealer: true,
        dealer_package_order: true,
        dealer_customer: true,
        dealer_customer_vehicle: true,
        sub_service: true,
        vendor: true,
        driver: true,
        assigned_vehicle: true,
      },
    });

    return this.formatOrderResponse(updated);
  }

  // ─── Query Methods ─────────────────────────────────────────────────────────

  /**
   * Formats order object with FlutterFlow alias properties
   */
  formatOrderResponse(order: any) {
    if (!order) return order;
    return {
      ...order,
      client_id: order.dealer_id,
      tp_membership_id: order.dealer_package_order_id,
      customer: order.customer_name,
      vehicle_registration_number: order.vehicle_reg_number,
      vehicle_problem: order.remarks,
      upload_images: order.images,
    };
  }

  /**
   * Retrieves paginated admin package orders with optional filters
   */
  async findAllAsync(query: AdminPackageOrderQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.admin_package_orderWhereInput = {};

    if (query.client_id || query.dealer_id) {
      where.dealer_id = Number(query.client_id || query.dealer_id);
    }
    if (query.tp_membership_id || query.dealer_package_order_id) {
      where.dealer_package_order_id = Number(
        query.tp_membership_id || query.dealer_package_order_id,
      );
    }
    if (query.status) where.status = query.status;
    if (query.order_type) where.order_type = query.order_type;

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { formated_id: { contains: term, mode: 'insensitive' } },
        { customer_name: { contains: term, mode: 'insensitive' } },
        { customer_number: { contains: term, mode: 'insensitive' } },
        { vehicle_reg_number: { contains: term, mode: 'insensitive' } },
        { vehicle_chassis_number: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.admin_package_order.count({ where }),
      this.prisma.admin_package_order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          dealer: {
            select: { id: true, formated_id: true, name: true },
          },
          dealer_package_order: {
            select: {
              id: true,
              formated_id: true,
              order_number: true,
              plan_name: true,
            },
          },
          sub_service: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      items: items.map((order) => this.formatOrderResponse(order)),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single admin package order details by ID
   */
  async findOneAsync(id: number) {
    const order = await this.prisma.admin_package_order.findUnique({
      where: { id },
      include: {
        dealer: true,
        dealer_package_order: true,
        dealer_customer: true,
        dealer_customer_vehicle: true,
        sub_service: true,
        vendor: true,
        driver: true,
        assigned_vehicle: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Admin package order #${id} was not found.`);
    }

    return this.formatOrderResponse(order);
  }
}
