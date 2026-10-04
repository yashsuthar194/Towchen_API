import { SetMetadata } from '@nestjs/common';
import { ConsentRole } from '@prisma/client';

export const CONSENT_ROLE_KEY = 'consent_role';

/**
 * Decorator to specify the required ConsentRole for an endpoint.
 *
 * @param role - ConsentRole (Approver, Verifier, Finalizer)
 */
export const RequireConsentRole = (role: ConsentRole) => SetMetadata(CONSENT_ROLE_KEY, role);
