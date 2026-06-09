import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { SmsService } from 'src/services/sms/sms.service';
import { OrderOtpType } from '@prisma/client';

/**
 * Handles all SMS notifications related to the order lifecycle.
 *
 * Design principles:
 * - **SRP**: This service owns order-specific notification logic only.
 * - **Fault-isolated**: Every public method swallows exceptions and logs them.
 *   A broken SMS gateway or an invalid phone number will never cause an order
 *   creation to fail or roll back.
 * - **Fire-and-forget friendly**: Callers can safely `await` or call without
 *   awaiting — behaviour is the same either way.
 */
@Injectable()
export class OrderNotificationService {
  private readonly logger = new Logger(OrderNotificationService.name);

  constructor(
    private readonly _prisma: PrismaService,
    private readonly _smsService: SmsService,
  ) {}

  /**
   * Notifies the customer that their immediate order has been created
   * and is waiting for a driver to accept it.
   */
  async notifyOrderCreated(orderId: number, customerId: number): Promise<void> {
    const customer = await this.fetchCustomer(customerId);
    if (!customer) return;

    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      select: { formated_id: true },
    });

    const message =
      `Your order ${order?.formated_id ?? `#${orderId}`} has been received. ` +
      `A driver will be assigned to you shortly.`;

    await this.sendSafely(customer.number, message, `order-created:${orderId}`);
  }

  /**
   * Notifies the customer that their "Book for Later" booking has been saved
   * and will be automatically processed at the scheduled time.
   */
  async notifyOrderScheduled(scheduledAt: Date, customerId: number): Promise<void> {
    const customer = await this.fetchCustomer(customerId);
    if (!customer) return;

    const formatted = scheduledAt.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    });

    const message =
      `Your order has been scheduled for ${formatted}. ` +
      `We will automatically process it at that time.`;

    await this.sendSafely(customer.number, message, `order-scheduled:${scheduledAt.toISOString()}`);
  }

  /**
   * Notifies the customer that their scheduled booking has been successfully
   * promoted into a live order.
   */
  async notifyScheduledOrderPromoted(orderId: number, customerId: number): Promise<void> {
    const customer = await this.fetchCustomer(customerId);
    if (!customer) return;

    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      select: { formated_id: true },
    });

    const message =
      `Your scheduled order ${order?.formated_id ?? `#${orderId}`} is now live. ` +
      `A driver will be assigned to you shortly.`;

    await this.sendSafely(customer.number, message, `scheduled-promoted:${orderId}`);
  }

  /**
   * Notifies the customer that their scheduled booking could not be fulfilled
   * after exhausting all retry attempts.
   */
  async notifyScheduledOrderExpired(scheduledOrderId: number, customerId: number): Promise<void> {
    const customer = await this.fetchCustomer(customerId);
    if (!customer) return;

    const message =
      `We were unable to process your scheduled booking (ref: #${scheduledOrderId}) ` +
      `after multiple attempts. Please create a new order at your convenience.`;

    await this.sendSafely(customer.number, message, `scheduled-expired:${scheduledOrderId}`);
  }

  /**
   * Notifies the customer of their OTP code for starting or completing the order.
   */
  async notifyOrderOtp(
    orderId: number,
    customerNumber: string,
    otpCode: string,
    type: OrderOtpType,
  ): Promise<void> {
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      select: { formated_id: true },
    });

    const action = type === OrderOtpType.START ? 'start' : 'complete';
    const message =
      `Your OTP to ${action} order ${order?.formated_id ?? `#${orderId}`} is ${otpCode}.`;

    await this.sendSafely(customerNumber, message, `order-otp:${orderId}:${type}`);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /** Fetches a customer by ID, returning null and logging if not found. */
  private async fetchCustomer(customerId: number) {
    const customer = await this._prisma.customer.findUnique({
      where: { id: customerId },
      select: { number: true, full_name: true },
    });

    if (!customer) {
      this.logger.warn(`Cannot send SMS: customer ${customerId} not found`);
    }

    return customer;
  }

  /**
   * Sends an SMS and swallows any error, logging a warning instead.
   * This ensures notification failures are never surfaced to the caller.
   *
   * @param rawNumber - Phone number as stored in DB (may not be E.164)
   * @param message - Text body
   * @param context - Label used in log messages for traceability
   */
  private async sendSafely(rawNumber: string, message: string, context: string): Promise<void> {
    try {
      const to = this.toE164(rawNumber);
      await this._smsService.sendSmsAsync({ to, message });
      this.logger.log(`SMS sent [${context}] → ${to}`);
    } catch (error) {
      this.logger.warn(
        `SMS failed [${context}] → ${rawNumber}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Best-effort normalization to E.164 for Indian numbers.
   * Prefixes "+91" when the number looks like a 10-digit Indian mobile number.
   * Numbers that already start with "+" are passed through unchanged.
   */
  private toE164(number: string): string {
    const cleaned = number.replace(/\s+/g, '').replace(/-/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
    if (/^91\d{10}$/.test(cleaned)) return `+${cleaned}`;
    return cleaned; // pass through, SmsService will validate and log if invalid
  }
}
