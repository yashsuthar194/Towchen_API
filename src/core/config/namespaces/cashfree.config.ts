import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ConfigNamespace } from '../helper/config.decorator';
import { createConfigLoader } from '../helper/config.loader';

/**
 * Configuration for Cashfree Verification Suite (VRS).
 *
 * @remarks
 * Environment variables:
 * - CASHFREE_CLIENT_ID: Cashfree App / Client ID
 * - CASHFREE_CLIENT_SECRET: Cashfree Secret Key
 * - CASHFREE_BASE_URL: Base URL for VRS (defaults to https://api.cashfree.com/verification)
 * - CASHFREE_RC_DAILY_LIMIT: Maximum allowed vehicle RC API requests per dealer per day (defaults to 25)
 */
@ConfigNamespace('cashfree')
export class CashfreeConfig {
  @IsString({ message: 'CASHFREE_CLIENT_ID must be a string' })
  @IsOptional()
  CASHFREE_CLIENT_ID?: string;

  @IsString({ message: 'CASHFREE_CLIENT_SECRET must be a string' })
  @IsOptional()
  CASHFREE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  CASHFREE_BASE_URL?: string = 'https://api.cashfree.com/verification';

  @IsString()
  @IsOptional()
  CASHFREE_PUBLIC_KEY?: string;

  @IsInt({ message: 'CASHFREE_RC_DAILY_LIMIT must be an integer' })
  @Min(1, { message: 'CASHFREE_RC_DAILY_LIMIT must be at least 1' })
  @IsOptional()
  CASHFREE_RC_DAILY_LIMIT?: number = 25;

  get clientId(): string {
    return this.CASHFREE_CLIENT_ID || '';
  }

  get clientSecret(): string {
    return this.CASHFREE_CLIENT_SECRET || '';
  }

  get baseUrl(): string {
    return this.CASHFREE_BASE_URL || 'https://api.cashfree.com/verification';
  }

  get publicKey(): string | undefined {
    return this.CASHFREE_PUBLIC_KEY;
  }

  get rcDailyLimit(): number {
    return Number(this.CASHFREE_RC_DAILY_LIMIT) || 25;
  }
}

export const cashfreeConfig = createConfigLoader(CashfreeConfig);

