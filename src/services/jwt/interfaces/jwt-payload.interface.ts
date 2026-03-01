import { Role } from 'generated/prisma/enums';

/**
 * Interface representing the payload structure of a JWT token
 */
export interface JwtPayload {
  /**
   * Unique identifier for the user (vendor ID or driver ID)
   */
  id: number;

  /**
   * Email address of the user
   */
  email: string;

  /**
   * User type: 'vendor' or 'driver'
   */
  type: Role;

  /**
   * Indicates if the user's email is verified
   */
  is_email_verified?: boolean;

  /**
   * Indicates if the user's phone number is verified
   */
  is_number_verified?: boolean;

  /**
   * Token issued at timestamp (seconds since epoch)
   */
  iat?: number;

  /**
   * Token expiration timestamp (seconds since epoch)
   */
  exp?: number;
}
