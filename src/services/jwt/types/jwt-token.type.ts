/**
 * Type representing a complete JWT authentication response
 */
export type JwtTokens = {
  /**
   * JWT access token for API authentication
   * Short-lived token used for accessing protected resources
   */
  access_token: string;

  /**
   * JWT refresh token for obtaining new access tokens
   * Long-lived token used to refresh expired access tokens
   */
  refresh_token: string;
};
