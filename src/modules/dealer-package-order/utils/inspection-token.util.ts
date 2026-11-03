import * as crypto from 'crypto';

/**
 * Generates an encrypted, URL-safe token embedding orderId and orderNumber
 * with AES-256-CBC, random IV, and salt.
 */
export function generateEncryptedInspectionToken(
  orderId: number,
  orderNumber: string,
): string {
  const secret = process.env.JWT_SECRET || 'TOWCHEN_INSPECTION_SECURE_TOKEN_2026';
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  const payload = JSON.stringify({
    oid: orderId,
    num: orderNumber,
    ts: Date.now(),
    nonce: crypto.randomBytes(6).toString('hex'),
  });

  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // URL-safe encrypted hex string prefixed with 'insp_'
  return `insp_${iv.toString('hex')}${encrypted}`;
}

