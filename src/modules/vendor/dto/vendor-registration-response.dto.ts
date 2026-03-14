import { VendorDetailDto } from './vendor-detail.dto';

/**
 * Response DTO for vendor registration.
 *
 * Returns the newly created vendor's profile along with JWT tokens
 * so the vendor can immediately authenticate without a separate login step.
 */
export class VendorRegistrationResponseDto {
  /** The created vendor's complete profile */
  vendor: VendorDetailDto;

  /** JWT access token for API authentication (short-lived) */
  access_token: string;

  /** JWT refresh token for obtaining new access tokens (long-lived) */
  refresh_token: string;
}
