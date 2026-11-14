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
import { OrderClosureConsentHandler } from './order-closure-consent.handler';

@Injectable()
export class ConsentActionDispatcherService {
  private readonly logger = new Logger(ConsentActionDispatcherService.name);
  private readonly handlers = new Map<ConsentType, IConsentActionHandler>();

  constructor(
    private readonly orderEditHandler: OrderEditConsentHandler,
    private readonly orderClosureHandler: OrderClosureConsentHandler,
  ) {
    this.registerHandler(this.orderEditHandler);
    this.registerHandler(this.orderClosureHandler);
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
      this.logger.warn(
        `No dedicated execution handler registered for Consent Type: '${consent.consent_type}'. Permission granted without automated side-effects.`,
      );
      return;
    }

    await handler.execute(consent, tx);
  }
}
