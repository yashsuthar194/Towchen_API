import * as crypto from 'crypto';

/**
 * Generates a short, secure, URL-safe random token
 * (e.g. insp_a7b9c1d2e3f4g5h68901)
 * Completely opaque and unguessable while keeping the URL short and clean.
 */
export function generateEncryptedInspectionToken(
  orderId?: number,
  orderNumber?: string,
): string {
  // 10 random bytes = 20 hex characters (2^80 entropy: unguessable & collision-free)
  const rand = crypto.randomBytes(10).toString('hex');
  return `insp_${rand}`;
}
