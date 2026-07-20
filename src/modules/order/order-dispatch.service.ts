import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { DispatchService } from '../dispatch/dispatch.service';
import { OrderGateway, NewOrderPayload } from './order.gateway';
import { DispatchRoundStatus, LocationType } from '@prisma/client';

/**
 * Orchestrates the proximity-based driver dispatch flow.
 *
 * Called once, fire-and-forget, immediately after an order is committed
 * to the database. Responsible for:
 *
 *  1. Ranking all vendors by how close their nearest available driver is
 *     to the breakdown location (via DispatchService).
 *  2. Persisting the ranked list as order_dispatch rows (all Pending).
 *  3. Activating round 1 immediately — marks the closest vendor's row as
 *     Active, sets expires_at = now + 2 minutes, and emits a WebSocket
 *     "new-order" event to all connected drivers of that vendor.
 *
 * The 2-minute escalation (moving to the next vendor if no driver accepts)
 * is handled separately by OrderDispatchEscalationService (Phase 6).
 */
@Injectable()
export class OrderDispatchService {
  private readonly logger = new Logger(OrderDispatchService.name);

  /** Window given to each vendor's drivers before escalating (ms) */
  private static readonly DISPATCH_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchService: DispatchService,
    private readonly orderGateway: OrderGateway,
  ) {}

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Entry point — called fire-and-forget immediately after order creation.
   *
   * A failure here must NEVER surface to the API caller. The order has
   * already been committed; if dispatch fails the order simply stays New
   * and can be assigned manually by an admin.
   *
   * @param orderId        Newly created order's primary key
   * @param breakdownLat   Breakdown location latitude
   * @param breakdownLng   Breakdown location longitude
   * @param subServiceId   Filters eligible drivers to this sub-service
   */
  async initiateDispatchAsync(
    orderId: number,
    breakdownLat: number,
    breakdownLng: number,
    subServiceId: number,
  ): Promise<void> {
    try {
      // 1. Rank vendors by proximity to the breakdown location
      const ranked = await this.dispatchService.rankVendorsByProximityAsync(
        breakdownLat,
        breakdownLng,
        subServiceId,
      );

      if (ranked.length === 0) {
        this.logger.warn(
          `Order ${orderId}: no available drivers found for sub-service ${subServiceId}. ` +
            `Order stays New — manual assignment required.`,
        );
        return;
      }

      // 2. Persist all ranked vendors as Pending dispatch rounds in one shot
      await this.prisma.order_dispatch.createMany({
        data: ranked.map((entry, index) => ({
          order_id: orderId,
          vendor_id: entry.vendorId,
          rank: index + 1,
          status: DispatchRoundStatus.Pending,
        })),
      });

      this.logger.log(
        `Order ${orderId}: ${ranked.length} dispatch round(s) queued. ` +
          `Closest vendor: ${ranked[0].vendorId} (${ranked[0].distanceKm.toFixed(2)} km)`,
      );

      // 3. Immediately activate round 1 — closest vendor goes first
      await this.activateRoundAsync(orderId, ranked[0].vendorId);
    } catch (error) {
      // Swallow all errors — dispatch failure must never roll back the order
      this.logger.error(
        `Order ${orderId}: dispatch initiation failed — ` +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  /**
   * Activates a single dispatch round for the given vendor:
   *  - Updates the order_dispatch row: Pending → Active
   *  - Sets notified_at = now, expires_at = now + 2 minutes
   *  - Emits "new-order" WebSocket event to all connected drivers of that vendor
   *
   * This method is intentionally public so the escalation cron (Phase 6)
   * can call it directly when moving to the next vendor in the queue.
   *
   * @param orderId   Order to activate the round for
   * @param vendorId  Vendor whose drivers should be notified
   */
  async activateRoundAsync(orderId: number, vendorId: number): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OrderDispatchService.DISPATCH_WINDOW_MS);

    // 1. Mark this vendor's dispatch row as Active
    await this.prisma.order_dispatch.updateMany({
      where: {
        order_id: orderId,
        vendor_id: vendorId,
        status: DispatchRoundStatus.Pending,
      },
      data: {
        status: DispatchRoundStatus.Active,
        notified_at: now,
        expires_at: expiresAt,
      },
    });

    // 2. Load order + breakdown location for the WebSocket payload
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        service: true,
        sub_service: true,
        locations: {
          where: { type: LocationType.Breakdown },
        },
      },
    });

    if (!order) {
      this.logger.warn(`Order ${orderId}: not found when building dispatch payload`);
      return;
    }

    const breakdown = order.locations[0];
    if (!breakdown) {
      this.logger.warn(`Order ${orderId}: no Breakdown location found`);
      return;
    }

    // 3. Build payload and emit WebSocket notification to the vendor's drivers
    const payload: NewOrderPayload = {
      orderId: order.id,
      formatedId: order.formated_id,
      serviceName: order.service.name,
      subServiceName: order.sub_service?.name ?? '',
      breakdown: {
        address: breakdown.address ?? '',
        latitude: breakdown.latitude,
        longitude: breakdown.longitude,
      },
      expiresAt: expiresAt.toISOString(),
    };

    this.orderGateway.notifyVendorDrivers(vendorId, payload);

    this.logger.log(
      `Order ${orderId}: round activated for vendor ${vendorId}. ` +
        `Window expires at ${expiresAt.toISOString()}`,
    );
  }
}
