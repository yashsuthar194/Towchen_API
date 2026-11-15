import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ConsentType,
  OrderStatus,
  Prisma,
  consent_request,
} from '@prisma/client';
import { IConsentActionHandler } from './consent-action-handler.interface';

@Injectable()
export class OrderClosureConsentHandler implements IConsentActionHandler {
  readonly consentType = ConsentType.OrderClosure;
  private readonly logger = new Logger(OrderClosureConsentHandler.name);

  async execute(
    consent: consent_request,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (!consent.entity_id) {
      throw new BadRequestException(
        `Cannot execute OrderClosure consent without entity_id. Consent ID: ${consent.id}`,
      );
    }

    const order = await tx.order.findUnique({
      where: { id: consent.entity_id },
      select: { id: true, formated_id: true, status: true },
    });

    if (!order) {
      throw new NotFoundException(
        `Target Order #${consent.entity_id} was not found while applying OrderClosure consent #${consent.id}.`,
      );
    }

    if (order.status === OrderStatus.Closed) {
      this.logger.warn(
        `Order #${order.id} (${order.formated_id}) is already in 'Closed' status. Skipping redundant update.`,
      );
      return;
    }

    // Advance status to Closed
    await tx.order.update({
      where: { id: consent.entity_id },
      data: {
        status: OrderStatus.Closed,
      },
    });

    this.logger.log(
      `OrderClosure Consent #${consent.id} finalized: Order #${order.id} (${order.formated_id}) status transitioned from '${order.status}' to 'Closed'.`,
    );
  }
}
