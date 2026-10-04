import {
  Injectable,
  NotImplementedException,
  Logger,
} from '@nestjs/common';
import {
  ConsentEntityType,
  Prisma,
  consent_request,
} from '@prisma/client';
import { IConsentActionHandler } from './consent-action-handler.interface';
import { OrderEditConsentHandler } from './order-edit-consent.handler';

@Injectable()
export class ConsentActionDispatcherService {
  private readonly logger = new Logger(ConsentActionDispatcherService.name);
  private readonly handlers = new Map<ConsentEntityType, IConsentActionHandler>();

  constructor(private readonly orderEditHandler: OrderEditConsentHandler) {
    this.registerHandler(this.orderEditHandler);
  }

  private registerHandler(handler: IConsentActionHandler): void {
    this.handlers.set(handler.entityType, handler);
    this.logger.log(`Registered consent handler for entity: ${handler.entityType}`);
  }

  /**
   * Dispatches the consent execution to the corresponding handler within a transaction.
   */
  async dispatch(
    consent: consent_request,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const handler = this.handlers.get(consent.entity_type);

    if (!handler) {
      throw new NotImplementedException(
        `No execution handler registered for Consent Entity Type: '${consent.entity_type}'.`,
      );
    }

    await handler.execute(consent, tx);
  }
}
