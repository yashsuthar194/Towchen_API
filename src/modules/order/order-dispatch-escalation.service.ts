import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { OrderDispatchService } from './order-dispatch.service';
import { DispatchRoundStatus, OrderStatus } from '@prisma/client';

/**
 * Escalation processor for the proximity-based driver dispatch system.
 *
 * Runs on a 30-second cron schedule and handles the "no driver accepted
 * within 2 minutes" case by moving expired dispatch rounds to the next
 * closest vendor in the queue.
 *
 * Why a cron (not setTimeout)?
 *  - setTimeout is lost on server restart.
 *  - A DB-driven cron (`expires_at` column) survives restarts — on boot
 *    the cron immediately picks up any rounds that expired while the
 *    server was down.
 *
 * Future upgrade path:
 *  - When Redis is added, replace this cron with a BullMQ delayed job
 *    enqueued from OrderDispatchService.activateRoundAsync. The
 *    activateRoundAsync method itself stays unchanged.
 */
@Injectable()
export class OrderDispatchEscalationService {
  private readonly logger = new Logger(OrderDispatchEscalationService.name);

  /** Guard against overlapping cron runs if the DB query is slow */
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly orderDispatchService: OrderDispatchService,
  ) {}

  // ─── Cron ──────────────────────────────────────────────────────────────────

  /**
   * Runs every 30 seconds.
   *
   * Finds all Active dispatch rounds whose expires_at has passed without
   * a driver accepting the order, marks them Skipped, and activates the
   * next Pending round (next closest vendor) if one exists.
   *
   * Timing note: the 30-second interval means escalation may fire up to
   * 30 seconds after the 2-minute window closes. This is acceptable — the
   * driver's app already shows a countdown from expiresAt (sent in the
   * WebSocket payload), so the UX is not impacted by the cron granularity.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async escalateExpiredRoundsAsync(): Promise<void> {
    // Prevent overlapping runs (e.g. if DB is slow and cron fires again)
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();

      // Query only the columns we need — include order.status to guard
      // against escalating an already-accepted order
      const expiredRounds = await this.prisma.order_dispatch.findMany({
        where: {
          status: DispatchRoundStatus.Active,
          expires_at: { lte: now }, // window has closed
        },
        select: {
          id: true,
          order_id: true,
          vendor_id: true,
          rank: true,
          order: { select: { status: true } },
        },
      });

      if (expiredRounds.length === 0) return;

      this.logger.log(
        `Escalation cron: ${expiredRounds.length} expired round(s) detected`,
      );

      // Process each expired round independently so one failure
      // doesn't block the others
      await Promise.allSettled(
        expiredRounds.map((round) => this.processExpiredRoundAsync(round)),
      );
    } catch (error) {
      this.logger.error(
        `Escalation cron top-level error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async processExpiredRoundAsync(round: {
    id: number;
    order_id: number;
    vendor_id: number;
    rank: number;
    order: { status: string };
  }): Promise<void> {
    try {
      // Guard: order was accepted during this window — just clean up the row
      if (round.order.status !== OrderStatus.New) {
        await this.prisma.order_dispatch.update({
          where: { id: round.id },
          data: { status: DispatchRoundStatus.Skipped },
        });
        this.logger.debug(
          `Order ${round.order_id}: rank ${round.rank} cleaned up ` +
            `(order already ${round.order.status})`,
        );
        return;
      }

      // Mark the expired round as Skipped
      await this.prisma.order_dispatch.update({
        where: { id: round.id },
        data: { status: DispatchRoundStatus.Skipped },
      });

      this.logger.log(
        `Order ${round.order_id}: vendor ${round.vendor_id} (rank ${round.rank}) → Skipped`,
      );

      // Find the next Pending vendor in the queue (rank + 1)
      const nextRound = await this.prisma.order_dispatch.findFirst({
        where: {
          order_id: round.order_id,
          rank: round.rank + 1,
          status: DispatchRoundStatus.Pending,
        },
        select: { vendor_id: true, rank: true },
      });

      if (!nextRound) {
        this.logger.warn(
          `Order ${round.order_id}: all ${round.rank} vendor(s) exhausted — ` +
            `no driver accepted. Manual assignment may be required.`,
        );
        // TODO (future): send admin alert via SMS / dashboard notification
        return;
      }

      // Activate the next vendor's round — notifies their drivers via WebSocket
      await this.orderDispatchService.activateRoundAsync(
        round.order_id,
        nextRound.vendor_id,
      );

      this.logger.log(
        `Order ${round.order_id}: escalated to vendor ${nextRound.vendor_id} ` +
          `(rank ${nextRound.rank})`,
      );
    } catch (error) {
      this.logger.error(
        `Order ${round.order_id} escalation failed (vendor=${round.vendor_id}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
