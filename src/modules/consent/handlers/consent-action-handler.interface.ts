import { ConsentEntityType, Prisma, consent_request } from '@prisma/client';

export interface IConsentActionHandler {
  readonly entityType: ConsentEntityType;

  /**
   * Executes the committed action when consent reaches PERMISSION_GRANTED.
   * Runs inside an atomic Prisma transaction.
   *
   * @param consent - The consent_request record
   * @param tx - Prisma Transaction Client
   */
  execute(
    consent: consent_request,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}
