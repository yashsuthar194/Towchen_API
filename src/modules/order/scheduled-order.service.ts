import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import {
  ScheduledOrderStatus,
  OrderStatus,
  OrderType,
  LocationCategory,
  LocationType,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto } from './dto/create-order.dto';
import { ScheduledOrderDetailDto } from './dto/scheduled-order-detail.dto';
import { OrderNotificationService } from './order-notification.service';
import { MapsService } from 'src/services/maps/maps.service';
import { LocationResponseDto } from '../location/dto/location-response.dto';
import { DispatchService } from '../dispatch/dispatch.service';
import { VoucherService } from '../voucher/voucher.service';

/** Minimum minutes in the future a booking must be scheduled (2 hours minimum advance notice). */
const MIN_ADVANCE_MINUTES = 120;

/** Maximum days in the future a booking can be scheduled. */
const MAX_ADVANCE_DAYS = 7;

@Injectable()
export class ScheduledOrderService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _notificationService: OrderNotificationService,
    private readonly _mapsService: MapsService,
    private readonly _dispatchService: DispatchService,
    private readonly _voucherService: VoucherService,
  ) {}

  /**
   * Creates and schedules a new customer order with upfront system driver & vendor auto-assignment.
   *
   * @param customerId - Authenticated customer
   * @param scheduledAt - ISO 8601 string parsed from the request DTO
   * @param timezone - IANA timezone supplied by the client
   * @param payload - Already-mapped CreateOrderDto
   */
  async scheduleAsync(
    customerId: number,
    scheduledAt: string,
    timezone: string = 'Asia/Kolkata',
    payload: CreateOrderDto,
  ): Promise<ScheduledOrderDetailDto> {
    const scheduledDate = new Date(scheduledAt);
    this.validateScheduledAt(scheduledDate);

    // 1. Validate sub-service & journey type
    const subService = await this._prisma.sub_service.findUnique({
      where: { id: payload.sub_service_id },
    });
    if (!subService) {
      throw new NotFoundException(`Sub-service with ID ${payload.sub_service_id} not found`);
    }

    const isFourWay = subService.journey_type === 'FourWay';
    if (isFourWay && !payload.drop_location) {
      throw new BadRequestException('drop_location is required for FourWay journey sub-services');
    }

    // 2. Resolve breakdown address & drop address coordinates
    const breakdownAddress = await this._mapsService.resolveAddressByPlaceIdAsync(
      payload.breakdown_location.place_id,
    );
    let dropAddress: LocationResponseDto | null = null;
    if (isFourWay && payload.drop_location) {
      dropAddress = await this._mapsService.resolveAddressByPlaceIdAsync(
        payload.drop_location.place_id,
      );
    }

    // 3. System Auto-Assignment: find closest available driver without blackout conflict
    const assignment = await this._dispatchService.autoAssignScheduledDriverAsync({
      breakdownLat: breakdownAddress.latitude,
      breakdownLng: breakdownAddress.longitude,
      subServiceId: payload.sub_service_id,
      scheduledAt: scheduledDate,
    });

    // 4. Atomic transaction: create scheduled_order, validate voucher, and create order in Scheduled state
    const result = await this._prisma.$transaction(async (tx) => {
      // 4a. Persist scheduled_order booking row
      const scheduledOrder = await tx.scheduled_order.create({
        data: {
          idempotency_key: uuidv4(),
          customer_id: customerId,
          scheduled_at: scheduledDate,
          timezone,
          payload: payload as object,
        },
      });

      // 4b. Voucher validation + atomic redemption if provided
      let appliedVoucherId: number | null = null;
      let discountAmount = 0.0;
      let finalAmount = payload.sub_service_estimate?.grand_total_int
        ? parseFloat(payload.sub_service_estimate.grand_total_int)
        : null;

      if (payload.voucher_code) {
        const voucher = await this._voucherService.validateVoucherAsync(
          payload.voucher_code,
          customerId,
        );
        appliedVoucherId = voucher.id;

        const basePrice = payload.sub_service_estimate?.final_amount_int
          ? parseFloat(payload.sub_service_estimate.final_amount_int)
          : 0.0;
        discountAmount = parseFloat((basePrice * (voucher.discount_percent / 100)).toFixed(2));

        const grandTotal = payload.sub_service_estimate?.grand_total_int
          ? parseFloat(payload.sub_service_estimate.grand_total_int)
          : 0.0;
        finalAmount = Math.max(0, parseFloat((grandTotal - discountAmount).toFixed(2)));

        await this._voucherService.redeemVoucherAsync(payload.voucher_code, customerId, tx);
      }

      // 4c. Create the live order directly in Scheduled status with pre-assigned vendor and driver
      const order = await tx.order.create({
        data: {
          customer_id: customerId,
          customer_vehicle_id: payload.customer_vehicle_id,
          service_id: payload.service_id,
          sub_service_id: payload.sub_service_id,
          fleet_type: payload.sub_service_id,
          type: OrderType.Scheduled,
          status: OrderStatus.Scheduled,
          vendor_id: assignment.vendorId,
          driver_id: assignment.driverId,
          vehicle_id: assignment.vehicleId,
          assign_time: new Date(),
          formated_id: '', // Generated by database trigger
          applied_voucher_id: appliedVoucherId,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          scheduled_order_id: scheduledOrder.id,
          meta_data: payload.sub_service_estimate
            ? { sub_service: payload.sub_service_estimate }
            : undefined,
          is_physical_vcrf_for_pickup: payload.isPhysicalVcrfForPickup ?? true,
          is_physical_vcrf_for_dropoff: payload.isPhysicalVcrfForDropoff ?? true,
          pre_booked_images: payload.pre_booked_images,
        },
      });

      // 4d. Persist order locations
      const orderLocations: any[] = [
        {
          order_id: order.id,
          type: LocationType.Breakdown,
          contact_name: payload.breakdown_contact_name,
          contact_number: payload.breakdown_contact_number,
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
          place_id: payload.breakdown_location.place_id,
        },
      ];

      if (isFourWay && dropAddress && payload.drop_location) {
        orderLocations.push({
          order_id: order.id,
          type: LocationType.Drop,
          contact_name: payload.drop_contact_name,
          contact_number: payload.drop_contact_number,
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
          place_id: payload.drop_location.place_id,
        });
      }

      await tx.order_location.createMany({ data: orderLocations });

      // 4e. Link promoted_order_id on the scheduled_order row
      const updatedScheduledOrder = await tx.scheduled_order.update({
        where: { id: scheduledOrder.id },
        data: {
          promoted_order_id: order.id,
        },
      });

      return {
        scheduledOrder: updatedScheduledOrder,
        orderId: order.id,
      };
    });

    // 5. Fire-and-forget notifications outside transaction boundary
    void this._notificationService.notifyDriverAssignedToScheduledOrder(
      result.orderId,
      assignment.driverId,
      scheduledDate,
    );
    void this._notificationService.notifyOrderScheduled(scheduledDate, customerId);

    return result.scheduledOrder as unknown as ScheduledOrderDetailDto;
  }

  /**
   * Returns all scheduled orders belonging to the given customer,
   * sorted newest first.
   */
  async getListForCustomerAsync(customerId: number): Promise<ScheduledOrderDetailDto[]> {
    const rows = await this._prisma.scheduled_order.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
    });
    return rows as unknown as ScheduledOrderDetailDto[];
  }

  /**
   * Returns a single scheduled order, enforcing customer ownership.
   */
  async getByIdAsync(id: number, customerId: number): Promise<ScheduledOrderDetailDto> {
    const row = await this.findAndAssertOwnership(id, customerId);
    return row as unknown as ScheduledOrderDetailDto;
  }

  /**
   * Cancels a Pending scheduled order.
   * Orders already in Processing/Promoted/Expired/Cancelled cannot be cancelled.
   */
  async cancelAsync(
    id: number,
    customerId: number,
    reason?: string,
  ): Promise<ScheduledOrderDetailDto> {
    const row = await this.findAndAssertOwnership(id, customerId);

    if (row.status !== ScheduledOrderStatus.Pending) {
      throw new BadRequestException(
        `Cannot cancel a scheduled order with status "${row.status}". Only Pending orders can be cancelled.`,
      );
    }

    const updated = await this._prisma.scheduled_order.update({
      where: { id },
      data: {
        status: ScheduledOrderStatus.Cancelled,
        cancelled_at: new Date(),
        cancel_reason: reason ?? null,
      },
    });

    if (row.promoted_order_id) {
      await this._prisma.order.updateMany({
        where: { id: row.promoted_order_id, status: OrderStatus.Scheduled },
        data: {
          status: OrderStatus.Cancelled,
          cancel_reason: reason ?? null,
        },
      });
    }

    return updated as unknown as ScheduledOrderDetailDto;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Finds a scheduled_order row and verifies it belongs to `customerId`.
   * Throws NotFoundException or ForbiddenException accordingly.
   */
  private async findAndAssertOwnership(id: number, customerId: number) {
    const row = await this._prisma.scheduled_order.findUnique({ where: { id } });

    if (!row) {
      throw new NotFoundException(`Scheduled order with ID ${id} not found`);
    }

    if (row.customer_id !== customerId) {
      throw new ForbiddenException('You do not have access to this scheduled order');
    }

    return row;
  }

  /**
   * Enforces the allowed booking window:
   *  - At least MIN_ADVANCE_MINUTES from now
   *  - At most MAX_ADVANCE_DAYS days from now
   */
  private validateScheduledAt(scheduledDate: Date): void {
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('scheduled_at is not a valid date');
    }

    const now = new Date();
    const minAllowed = new Date(now.getTime() + MIN_ADVANCE_MINUTES * 60 * 1000);
    const maxAllowed = new Date(now.getTime() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);

    if (scheduledDate < minAllowed) {
      throw new BadRequestException(
        `scheduled_at must be at least ${MIN_ADVANCE_MINUTES} minutes (2 hours) in the future`,
      );
    }

    if (scheduledDate > maxAllowed) {
      throw new BadRequestException(
        `scheduled_at must be within ${MAX_ADVANCE_DAYS} days from now`,
      );
    }
  }

  /** Throws NotFoundException if the sub_service does not exist or is inactive. */
  private async assertSubServiceExists(subServiceId: number): Promise<void> {
    const subService = await this._prisma.sub_service.findUnique({
      where: { id: subServiceId },
    });

    if (!subService || !subService.is_active) {
      throw new NotFoundException(`Sub-service with ID ${subServiceId} not found or is inactive`);
    }
  }
}
