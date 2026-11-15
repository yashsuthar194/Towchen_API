import { SetMetadata } from '@nestjs/common';
import { DisputeRole } from '@prisma/client';

export const DISPUTE_ROLE_KEY = 'dispute_role';

/**
 * Decorator to specify the required DisputeRole for an endpoint.
 *
 * @param role - DisputeRole (Resolver, Verifier, Finalizer)
 */
export const RequireDisputeRole = (role: DisputeRole) =>
  SetMetadata(DISPUTE_ROLE_KEY, role);
