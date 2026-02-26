import { Role } from '@prisma/client';

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
   * Token issued at timestamp (seconds since epoch)
   */
  iat?: number;

  /**
   * Token expiration timestamp (seconds since epoch)
   */
  exp?: number;
}
