import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { ScheduledOrderStatus, scheduled_order } from '@prisma/client';
import { OrderCreationService } from './order-creation.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderNotificationService } from './order-notification.service';

/**
 * Minutes of inactivity before a stuck "Processing" row is returned to "Pending".
 * Guards against worker crashes mid-promotion leaving rows locked forever.
 */
const STALE_PROCESSING_TIMEOUT_MINUTES = 5;

/**
 * Processes due scheduled orders and promotes them into live orders.
 *
 * Two cron jobs run independently:
 *  1. {@link processScheduledOrders} — claims and promotes due bookings (every 2 min)
 *  2. {@link recoverStaleProcessingRows} — resets stuck "Processing" rows (every 10 min)
 *
 * Concurrency safety: the atomic conditional UPDATE (`WHERE status = 'Pending'`)
 * ensures only one worker instance ever claims a given row, even in a
 * multi-instance deployment.
 */
@Injectable()
export class ScheduledOrderProcessorService {
  private readonly logger = new Logger(ScheduledOrderProcessorService.name);

  constructor(
    private readonly _prisma: PrismaService,
    private readonly _orderCreationService: OrderCreationService,
    private readonly _notificationService: OrderNotificationService,
  ) {}

  // ─── Main promotion job ────────────────────────────────────────────────────

  @Cron('*/2 * * * *') // every 2 minutes
  async processScheduledOrders(): Promise<void> {
    const due = await this.claimDueOrders();

    if (due.length === 0) return;

    this.logger.log(`Processing ${due.length} due scheduled order(s)`);

    // Process sequentially to avoid flooding external APIs (Maps) in parallel
    for (const row of due) {
      await this.promoteSingle(row);
    }
  }

  // ─── Stale-lock recovery job ───────────────────────────────────────────────

  @Cron(CronExpression.EVERY_10_MINUTES)
  async recoverStaleProcessingRows(): Promise<void> {
    const cutoff = new Date(Date.now() - STALE_PROCESSING_TIMEOUT_MINUTES * 60 * 1000);

    // Use $executeRaw so we can compare two columns (attempt_count < max_attempts)
    // which Prisma's updateMany WHERE clause does not support natively.
    const result = await this._prisma.$executeRaw`
      UPDATE "scheduled_order"
      SET    "status" = 'Pending'
      WHERE  "status" = 'Processing'
        AND  "last_attempted_at" < ${cutoff}
        AND  "attempt_count" < "max_attempts"
    `;

    if (result > 0) {
      this.logger.warn(`Recovered ${result} stale Processing row(s) back to Pending`);
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Atomically claims due Pending rows by flipping their status to Processing.
   * The conditional WHERE clause (`status = Pending`) prevents double-claiming:
   * if two workers run simultaneously, Prisma's UPDATE will only affect rows
   * not yet claimed by the other worker.
   */
  private async claimDueOrders() {
    const now = new Date();

    // Fetch candidates first (read)
    const candidates = await this._prisma.scheduled_order.findMany({
      where: {
        status: ScheduledOrderStatus.Pending,
        scheduled_at: { lte: now },
      },
    });

    if (candidates.length === 0) return [];

    // Claim each one individually with a conditional update to prevent races
    const claimed: typeof candidates = [];

    for (const candidate of candidates) {
      const updated = await this._prisma.scheduled_order.updateMany({
        where: {
          id: candidate.id,
          status: ScheduledOrderStatus.Pending, // guard: only claim if still Pending
        },
        data: {
          status: ScheduledOrderStatus.Processing,
          last_attempted_at: now,
        },
      });

      if (updated.count === 1) {
        claimed.push(candidate);
      }
    }

    return claimed;
  }

  /**
   * Attempts to promote a single claimed scheduled order into a live order.
   * On success: status → Promoted, promoted_order_id set.
   * On failure: status → Failed (or Expired if max attempts exhausted).
   */
  private async promoteSingle(row: scheduled_order): Promise<void> {
    try {
      // Deserialize the stored payload snapshot back into a typed DTO
      const payload = row.payload as unknown as CreateOrderDto;

      const order = await this._orderCreationService.createForCustomerAsync(
        row.customer_id,
        payload,
        row.id, // scheduledOrderId — written to order.scheduled_order_id for traceability
      );

      await this._prisma.scheduled_order.update({
        where: { id: row.id },
        data: {
          status: ScheduledOrderStatus.Promoted,
          promoted_order_id: order.id,
        },
      });

      // Notify customer their booking is now a live order
      void this._notificationService.notifyScheduledOrderPromoted(order.id, row.customer_id);

      this.logger.log(`Scheduled order #${row.id} promoted → live order #${order.id}`);
    } catch (error) {
      const newAttemptCount = row.attempt_count + 1;
      const isExhausted = newAttemptCount >= row.max_attempts;

      await this._prisma.scheduled_order.update({
        where: { id: row.id },
        data: {
          status: isExhausted ? ScheduledOrderStatus.Expired : ScheduledOrderStatus.Failed,
          attempt_count: newAttemptCount,
          last_error: error instanceof Error ? error.message : String(error),
        },
      });

      this.logger.error(
        `Scheduled order #${row.id} promotion failed (attempt ${newAttemptCount}/${row.max_attempts}): ${error instanceof Error ? error.message : error}`,
      );

      if (isExhausted) {
        this.logger.warn(
          `Scheduled order #${row.id} has been marked Expired after exhausting all retries`,
        );
        // Notify customer their booking could not be fulfilled
        void this._notificationService.notifyScheduledOrderExpired(row.id, row.customer_id);
      }
    }
  }
}
