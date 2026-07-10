import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import { OrderStatus, LocationCategory, LocationType, TransactionType } from '@prisma/client';
import { MapsService } from 'src/services/maps/maps.service';
import { LocationResponseDto } from '../location/dto/location-response.dto';
import { VoucherService } from '../voucher/voucher.service';
import { WalletService } from '../wallet/wallet.service';
import { OrderNotificationService } from './order-notification.service';

@Injectable()
export class OrderCreationService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _mapsService: MapsService,
    private readonly _voucherService: VoucherService,
    private readonly _walletService: WalletService,
    private readonly _notificationService: OrderNotificationService,
  ) {}

  /**
   * Creates a new order for an explicitly provided customer ID.
   *
   * This is the canonical order-creation method. It is intentionally decoupled
   * from the HTTP request context so it can be safely called from:
   *  - The REST controller (via OrderService/controllers)
   *  - The scheduled-order processor (headless, no CallerService available)
   *
   * @param customerId - ID of the customer who owns the order
   * @param dto - Full order creation payload
   * @param scheduledOrderId - Optional FK to the scheduled_order row that triggered this creation
   */
  async createForCustomerAsync(
    customerId: number,
    dto: CreateOrderDto,
    scheduledOrderId?: number,
  ): Promise<OrderDetailDto> {
    try {
      if (!dto.sub_service_id) {
        throw new BadRequestException('sub_service_id cannot be empty');
      }

      const subService = await this._prisma.sub_service.findUnique({
        where: { id: dto.sub_service_id },
      });

      if (!subService) {
        throw new NotFoundException(`Sub-service with ID ${dto.sub_service_id} not found`);
      }

      const isFourWay = subService.journey_type === 'FourWay';

      if (isFourWay && !dto.drop_location) {
        throw new BadRequestException('drop_location is required for FourWay journey sub-services');
      }

      // Resolve addresses before opening the transaction (external API call)
      const breakdownAddress = await this._mapsService.resolveAddressByPlaceIdAsync(dto.breakdown_location.place_id);

      let dropAddress: LocationResponseDto | null = null;
      if (isFourWay && dto.drop_location) {
        dropAddress = await this._mapsService.resolveAddressByPlaceIdAsync(dto.drop_location.place_id);
      }

      const result = await this._prisma.$transaction(async (tx) => {
        // so we don't need to create entries in the general location table here.
        // 1. Persist breakdown location
        const breakdownLocation = await tx.location.create({
          data: {
            address: breakdownAddress.address,
            street: breakdownAddress.street,
            area: breakdownAddress.area,
            city: breakdownAddress.city,
            state: breakdownAddress.state,
            pincode: breakdownAddress.pincode,
            country: breakdownAddress.country,
            latitude: breakdownAddress.latitude,
            longitude: breakdownAddress.longitude,
            landmark: breakdownAddress.landmark,
            place_id: dto.breakdown_location.place_id,
            category: LocationCategory.Order,
          },
        });

        // 2. Persist drop location (FourWay only)
        let dropLocation: { id: number } | null = null;
        if (isFourWay && dropAddress && dto.drop_location) {
          dropLocation = await tx.location.create({
            data: {
              address: dropAddress.address,
              street: dropAddress.street,
              area: dropAddress.area,
              city: dropAddress.city,
              state: dropAddress.state,
              pincode: dropAddress.pincode,
              country: dropAddress.country,
              latitude: dropAddress.latitude,
              longitude: dropAddress.longitude,
              landmark: dropAddress.landmark,
              place_id: dto.drop_location.place_id,
              category: LocationCategory.Order,
            },
          });
        }

        // 3. Voucher validation + atomic redemption
        let appliedVoucherId: number | null = null;
        let discountAmount = 0.0;
        let finalAmount = dto.sub_service_estimate?.grand_total_int
          ? parseFloat(dto.sub_service_estimate.grand_total_int)
          : null;

        if (dto.voucher_code) {
          const voucher = await this._voucherService.validateVoucherAsync(dto.voucher_code, customerId);
          appliedVoucherId = voucher.id;

          const basePrice = dto.sub_service_estimate?.final_amount_int
            ? parseFloat(dto.sub_service_estimate.final_amount_int)
            : 0.0;
          discountAmount = parseFloat((basePrice * (voucher.discount_percent / 100)).toFixed(2));

          const grandTotal = dto.sub_service_estimate?.grand_total_int
            ? parseFloat(dto.sub_service_estimate.grand_total_int)
            : 0.0;
          finalAmount = Math.max(0, parseFloat((grandTotal - discountAmount).toFixed(2)));

          await this._voucherService.redeemVoucherAsync(dto.voucher_code, customerId, tx);
        }

        // 4. Create the order
        const order = await tx.order.create({
          data: {
            customer_id: customerId,
            customer_vehicle_id: dto.customer_vehicle_id,
            service_id: dto.service_id,
            sub_service_id: dto.sub_service_id,
            fleet_type: dto.sub_service_id,
            status: OrderStatus.New,
            formated_id: '', // Populated by DB trigger
            applied_voucher_id: appliedVoucherId,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            scheduled_order_id: scheduledOrderId ?? null,
            meta_data: dto.sub_service_estimate ? { sub_service: dto.sub_service_estimate } : undefined,
            is_physical_vcrf_for_pickup: dto.isPhysicalVcrfForPickup ?? true,
            is_physical_vcrf_for_dropoff: dto.isPhysicalVcrfForDropoff ?? true,
            pre_booked_images: dto.pre_booked_images,
          },
        });

        // 4. Link Locations to Order dynamically
        const orderLocationsToCreate: any[] = [
          {
            order_id: order.id,
            type: LocationType.Breakdown,
            contact_name: dto.breakdown_contact_name,
            contact_number: dto.breakdown_contact_number,
            address: breakdownAddress.address,
            street: breakdownAddress.street,
            area: breakdownAddress.area,
            city: breakdownAddress.city,
            state: breakdownAddress.state,
            pincode: breakdownAddress.pincode,
            country: breakdownAddress.country,
            latitude: breakdownAddress.latitude,
            longitude: breakdownAddress.longitude,
            landmark: breakdownAddress.landmark,
            place_id: dto.breakdown_location.place_id,
          },
        ];

        if (isFourWay && dropAddress && dto.drop_location) {
          orderLocationsToCreate.push({
            order_id: order.id,
            type: LocationType.Drop,
            contact_name: dto.drop_contact_name,
            contact_number: dto.drop_contact_number,
            address: dropAddress.address,
            street: dropAddress.street,
            area: dropAddress.area,
            city: dropAddress.city,
            state: dropAddress.state,
            pincode: dropAddress.pincode,
            country: dropAddress.country,
            latitude: dropAddress.latitude,
            longitude: dropAddress.longitude,
            landmark: dropAddress.landmark,
            place_id: dto.drop_location.place_id,
          });
        }

        await tx.order_location.createMany({ data: orderLocationsToCreate });

        return await tx.order.findUnique({
          where: { id: order.id },
          include: { locations: true },
        }) as unknown as OrderDetailDto;
      });

      // Transaction committed — send SMS outside the tx boundary so
      // a notification failure can never roll back the order.
      void this._notificationService.notifyOrderCreated(result.id, customerId);

      return result;
    } catch (error) {
      console.error('Error creating order:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order. Please try again.');
    }
  }
}
