import {
  Injectable,
  NotImplementedException,
  Logger,
} from '@nestjs/common';
import {
  ConsentType,
  Prisma,
  consent_request,
} from '@prisma/client';
import { IConsentActionHandler } from './consent-action-handler.interface';
import { OrderEditConsentHandler } from './order-edit-consent.handler';

@Injectable()
export class ConsentActionDispatcherService {
  private readonly logger = new Logger(ConsentActionDispatcherService.name);
  private readonly handlers = new Map<ConsentType, IConsentActionHandler>();

  constructor(private readonly orderEditHandler: OrderEditConsentHandler) {
    this.registerHandler(this.orderEditHandler);
  }

  private registerHandler(handler: IConsentActionHandler): void {
    this.handlers.set(handler.consentType, handler);
    this.logger.log(`Registered consent handler for consent type: ${handler.consentType}`);
  }

  /**
   * Dispatches the consent execution to the corresponding handler within a transaction.
   */
  async dispatch(
    consent: consent_request,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const handler = this.handlers.get(consent.consent_type);

    if (!handler) {
      throw new NotImplementedException(
        `No execution handler registered for Consent Type: '${consent.consent_type}'.`,
      );
    }

    await handler.execute(consent, tx);
  }
}
