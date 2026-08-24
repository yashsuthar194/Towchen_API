import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from 'src/services/jwt/jwt.service';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { Role } from '@prisma/client';

// ─── Payload sent to driver apps on a new dispatch round ────────────────────

export interface NewOrderPayload {
  orderId: number;
  formatedId: string;
  serviceName: string;
  subServiceName: string;

  vehicleImages: string[];
  vehicleMake: string;
  vehicleModel: string;

  totalAmount: number;
  paymentStatus: string;

  customerName: string;
  customerRatings: number;

  totalKm: number;

  breakdown: {
    address: string;
    latitude: number;
    longitude: number;
  };

  dropoff?: {
    address: string;
    latitude: number;
    longitude: number;
  };

  conditions: {
    id: number;
    condition: string;
    status: string;
  }[];

  /** ISO 8601 timestamp — mobile app uses this to show a 2-min countdown */
  expiresAt: string;
}

// ────────────────────────────────────────────────────────────────────────────

/**
 * WebSocket gateway for real-time driver notifications.
 *
 * Namespace : /orders
 * Auth      : Bearer JWT passed via socket.handshake.auth.token
 * Rooms     : Each driver is placed in room "vendor:{vendorId}" so the server
 *             can broadcast to ALL online drivers of a vendor with a single emit.
 *
 * Connection lifecycle:
 *   1. Driver opens app → connects with JWT → joins vendor room
 *   2. Dispatch orchestrator calls notifyVendorDrivers() → emits "new-order"
 *      to the vendor room → all connected drivers receive it instantly
 *   3. Driver closes app → socket disconnects → leaves room automatically
 *
 * Note: drivers who are not connected simply miss the socket event.
 * Background-app behaviour is handled by Socket.IO's keep-alive — the TCP
 * connection stays active when the app is backgrounded on iOS and Android.
 */
@Injectable()
@WebSocketGateway({ namespace: '/orders', cors: { origin: '*' } })
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(OrderGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Connection ────────────────────────────────────────────────────────────

  async handleConnection(socket: Socket): Promise<void> {
    try {
      // 1. Extract token from handshake auth object
      //    Mobile client sends: { auth: { token: "Bearer <jwt>" } }
      const raw = socket.handshake.auth?.token as string | undefined;
      const token = raw?.replace(/^Bearer\s+/i, '').trim();

      if (!token) {
        this.logger.warn(`WS connection rejected: no token (socketId=${socket.id})`);
        socket.disconnect();
        return;
      }

      // 2. Verify and decode using the project's JwtService
      const payload = await this.jwtService.verifyToken(token);

      // 3. Only drivers are allowed to connect to this gateway
      if (payload.type !== Role.Driver) {
        this.logger.warn(
          `WS connection rejected: role=${payload.type} is not Driver (socketId=${socket.id})`,
        );
        socket.disconnect();
        return;
      }

      const driverId = payload.id;

      // 4. Load the driver's vendor_id from DB
      const driver = await this.prisma.driver.findUnique({
        where: { id: driverId },
        select: { vendor_id: true },
      });

      if (!driver) {
        this.logger.warn(
          `WS connection rejected: driver ${driverId} not found (socketId=${socket.id})`,
        );
        socket.disconnect();
        return;
      }

      // 5. Join the vendor room — all drivers of the same vendor share one room.
      //    The server broadcasts to this room without tracking individual socket IDs.
      const room = `vendor:${driver.vendor_id}`;
      await socket.join(room);

      // Store on socket for use in disconnect log
      socket.data.driverId = driverId;
      socket.data.vendorId = driver.vendor_id;

      this.logger.log(
        `Driver ${driverId} connected → room "${room}" (socketId=${socket.id})`,
      );
    } catch (error) {
      this.logger.warn(
        `WS connection error (socketId=${socket.id}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const driverId = socket.data?.driverId ?? 'unknown';
    const vendorId = socket.data?.vendorId ?? 'unknown';
    this.logger.log(
      `Driver ${driverId} disconnected (vendor=${vendorId}, socketId=${socket.id})`,
    );
  }

  // ─── Outbound Events ───────────────────────────────────────────────────────

  /**
   * Emits a "new-order" event to all connected drivers belonging to a vendor.
   *
   * Called by OrderDispatchService when a vendor's dispatch round starts.
   * Drivers not currently connected simply won't receive the event — that is
   * acceptable for now (offline notifications via FCM can be added later).
   *
   * @param vendorId - The vendor whose drivers should be notified
   * @param payload  - Order summary + expiry timestamp for countdown timer
   */
  notifyVendorDrivers(vendorId: number, payload: NewOrderPayload): void {
    const room = `vendor:${vendorId}`;
    this.server.to(room).emit('new-order', payload);
    this.logger.log(
      `"new-order" emitted → room "${room}" (orderId=${payload.orderId}, expiresAt=${payload.expiresAt})`,
    );
  }
}
