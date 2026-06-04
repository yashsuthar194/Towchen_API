import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ScheduledOrderStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderDto } from './dto/create-order.dto';
import { ScheduledOrderDetailDto } from './dto/scheduled-order-detail.dto';
import { OrderNotificationService } from './order-notification.service';

/** Minimum minutes in the future a booking must be scheduled. */
const MIN_ADVANCE_MINUTES = 5;

/** Maximum days in the future a booking can be scheduled. */
const MAX_ADVANCE_DAYS = 7;

@Injectable()
export class ScheduledOrderService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _notificationService: OrderNotificationService,
  ) {}

  /**
   * Saves a new scheduled order for future promotion.
   *
   * Only light validations run here (date range, entity existence).
   * Heavy external calls (Maps API, voucher redemption) are deferred
   * to execution time so transient service issues do not block booking.
   *
   * @param customerId - Authenticated customer
   * @param scheduledAt - ISO 8601 string parsed from the request DTO
   * @param timezone - IANA timezone supplied by the client
   * @param payload - Already-mapped CreateOrderDto stored as a JSON snapshot
   */
  async scheduleAsync(
    customerId: number,
    scheduledAt: string,
    timezone: string = 'Asia/Kolkata',
    payload: CreateOrderDto,
  ): Promise<ScheduledOrderDetailDto> {
    const scheduledDate = new Date(scheduledAt);
    this.validateScheduledAt(scheduledDate);

    // Light pre-flight: verify referenced entities exist (no external API calls)
    await this.assertSubServiceExists(payload.sub_service_id);

    const row = await this._prisma.scheduled_order.create({
      data: {
        idempotency_key: uuidv4(),
        customer_id: customerId,
        scheduled_at: scheduledDate,
        timezone,
        payload: payload as object,
      },
    });

    // Notify customer — fire-and-forget, never throws
    void this._notificationService.notifyOrderScheduled(scheduledDate, customerId);

    return row as unknown as ScheduledOrderDetailDto;
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
        `scheduled_at must be at least ${MIN_ADVANCE_MINUTES} minutes in the future`,
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
