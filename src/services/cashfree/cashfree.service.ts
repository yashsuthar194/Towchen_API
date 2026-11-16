import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  BadGatewayException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { VerifyVehicleRcDto } from './dto/verify-vehicle-rc.dto';
import { ICashfreeVehicleRcResponse } from './interfaces/cashfree-rc-response.interface';
import { CashfreeRateLimiterService, VehicleRcUsageStatus } from './cashfree-rate-limiter.service';

@Injectable()
export class CashfreeService {
  private readonly logger = new Logger(CashfreeService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly publicKeyContent?: string;

  constructor(
    private readonly configService: TypedConfigService,
    private readonly rateLimiter: CashfreeRateLimiterService,
  ) {
    this.clientId = this.configService.cashfree.clientId;
    this.clientSecret = this.configService.cashfree.clientSecret;
    this.baseUrl = (this.configService.cashfree.baseUrl || 'https://api.cashfree.com/verification').replace(/\/+$/, '');
    this.publicKeyContent = this.configService.cashfree.publicKey;

    this.logger.log(`Cashfree service initialized with baseUrl: ${this.baseUrl}`);
    if (this.publicKeyContent && this.publicKeyContent.trim().length > 0) {
      this.logger.log(`Cashfree Public Key configured in env - dynamic 2FA signature (x-cf-signature) active`);
    }
  }

  /**
   * Retrieves current vehicle RC rate limit and daily usage statistics
   */
  async getRcUsage(dealerId?: number | null): Promise<VehicleRcUsageStatus> {
    return this.rateLimiter.getUsageStatus(dealerId);
  }

  /**
   * Reads and formats the Public Key from environment variable
   */
  private getPublicKeyPem(): string | null {
    if (!this.publicKeyContent || this.publicKeyContent.trim().length === 0) {
      return null;
    }

    let raw = this.publicKeyContent.trim();
    // Handle escaped newlines (e.g. from .env file)
    if (raw.includes('\\n')) {
      raw = raw.replace(/\\n/g, '\n');
    }
    if (!raw.includes('-----BEGIN')) {
      raw = `-----BEGIN PUBLIC KEY-----\n${raw}\n-----END PUBLIC KEY-----`;
    }
    return raw;
  }

  /**
   * Generates dynamic x-cf-signature using RSA encryption with the Cashfree Public Key.
   * This allows authenticating requests from dynamic/cloud IPs without static IP whitelisting.
   */
  generateSignature(): { signature: string; timestamp: number } | null {
    const pem = this.getPublicKeyPem();
    if (!pem) return null;

    const timestamp = Math.floor(Date.now() / 1000);
    const dataMessage = `${this.clientId}.${timestamp}`;
    const bufferData = Buffer.from(dataMessage, 'utf8');

    try {
      // Cashfree 2FA signature standard: RSA-OAEP with SHA-1
      const encrypted = crypto.publicEncrypt(
        {
          key: pem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha1',
        },
        bufferData,
      );

      return {
        signature: encrypted.toString('base64'),
        timestamp,
      };
    } catch (oaepError) {
      this.logger.warn(
        `RSA-OAEP encryption failed (${oaepError.message}), attempting RSA_PKCS1_PADDING fallback`,
      );
      try {
        const encrypted = crypto.publicEncrypt(
          {
            key: pem,
            padding: crypto.constants.RSA_PKCS1_PADDING,
          },
          bufferData,
        );

        return {
          signature: encrypted.toString('base64'),
          timestamp,
        };
      } catch (pkcsError) {
        this.logger.error(
          `Failed to generate Cashfree RSA signature: ${pkcsError.message}`,
        );
        return null;
      }
    }
  }

  /**
   * Fetch Vehicle RC details from Cashfree Verification Suite
   *
   * @param dto VerifyVehicleRcDto containing vehicle_number, optional verification_id, and optional dealer_id
   * @param dealerId Optional dealer ID context
   * @returns ICashfreeVehicleRcResponse
   */
  async getVehicleRcDetails(
    dto: VerifyVehicleRcDto,
    dealerId?: number | null,
  ): Promise<ICashfreeVehicleRcResponse> {
    const effectiveDealerId = dto.dealer_id ?? dealerId;
    const vehicleNumber = (dto.vehicle_number || '').replace(/[\s-]/g, '').toUpperCase();
    if (!vehicleNumber) {
      throw new BadRequestException('A valid vehicle_number is required');
    }

    // Check rate limit and daily cache
    const check = await this.rateLimiter.checkAllowed(vehicleNumber, effectiveDealerId);
    if (check.cachedData) {
      this.logger.log(
        `Vehicle RC details for ${vehicleNumber} served from daily cache (avoiding duplicate external Cashfree API hit)`,
      );
      return check.cachedData;
    }

    if (!check.allowed) {
      const dealerMsg = effectiveDealerId ? ` for dealer #${effectiveDealerId}` : '';
      this.logger.warn(
        `Daily limit of ${check.usage.limit} vehicle RC requests reached${dealerMsg}! Blocking request for ${vehicleNumber}.`,
      );

      // Record blocked attempt
      await this.rateLimiter.recordHit({
        vehicleNumber,
        dealerId: effectiveDealerId,
        verificationId: dto.verification_id,
        status: 'BLOCKED',
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        errorMessage: `Daily limit of ${check.usage.limit} vehicle RC verification requests reached${dealerMsg}`,
      });

      throw new HttpException(
        {
          message: `Daily limit of ${check.usage.limit} vehicle RC verification requests reached${dealerMsg}. Please try again tomorrow or enter details manually.`,
          error: 'Too Many Requests',
          limit: check.usage.limit,
          used: check.usage.used,
          remaining: 0,
          reset_at: check.usage.reset_at,
          dealer_id: effectiveDealerId ?? null,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException(
        'Cashfree API credentials (CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET) are not configured in environment variables.',
      );
    }

    const verificationId =
      dto.verification_id?.trim() ||
      `rc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const url = `${this.baseUrl}/vehicle-rc`;
    const payload = {
      verification_id: verificationId,
      vehicle_number: vehicleNumber,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-client-id': this.clientId,
      'x-client-secret': this.clientSecret,
    };

    // If Cashfree public key is configured, attach dynamic x-cf-signature to bypass IP whitelisting
    const signatureInfo = this.generateSignature();
    if (signatureInfo) {
      headers['x-cf-signature'] = signatureInfo.signature;
      this.logger.log(`Attached dynamic x-cf-signature to Cashfree request (bypassing static IP whitelisting)`);
    }

    this.logger.log(
      `Sending RC verification request to Cashfree: URL=${url}, vehicle_number=${vehicleNumber}, verification_id=${verificationId}`,
    );

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      this.logger.error(`Network error connecting to Cashfree API: ${error.message}`, error.stack);
      await this.rateLimiter.recordHit({
        vehicleNumber,
        dealerId: effectiveDealerId,
        verificationId,
        status: 'FAILED',
        statusCode: HttpStatus.BAD_GATEWAY,
        errorMessage: `Failed to connect to Cashfree: ${error.message}`,
      });
      throw new BadGatewayException(`Failed to connect to Cashfree Verification API: ${error.message}`);
    }

    let responseData: any;
    try {
      responseData = await response.json();
    } catch (parseError) {
      this.logger.error(`Failed to parse Cashfree response: ${parseError.message}`);
      await this.rateLimiter.recordHit({
        vehicleNumber,
        dealerId: effectiveDealerId,
        verificationId,
        status: 'FAILED',
        statusCode: response.status,
        errorMessage: `Invalid JSON response received from Cashfree: HTTP ${response.status}`,
      });
      throw new BadGatewayException(`Invalid response received from Cashfree: HTTP ${response.status}`);
    }

    if (!response.ok) {
      const errorMessage = responseData?.message || responseData?.error || 'Unknown error from Cashfree';
      const errorCode = responseData?.code || responseData?.type || '';

      this.logger.warn(
        `Cashfree API returned error HTTP ${response.status} [${errorCode}]: ${errorMessage}`,
      );

      await this.rateLimiter.recordHit({
        vehicleNumber,
        dealerId: effectiveDealerId,
        verificationId,
        status: 'FAILED',
        statusCode: response.status,
        errorMessage: `HTTP ${response.status} [${errorCode}]: ${errorMessage}`,
      });

      if (
        errorMessage.includes('test data in the test environment') ||
        errorCode === 'test_data_required'
      ) {
        throw new BadRequestException(
          `Cashfree Sandbox Error: Please use test data in the test environment (e.g. HJ01ME5678). Refer to: https://www.cashfree.com/docs/api-reference/vrs/data-to-test-integration`,
        );
      }

      if (response.status === 403) {
        throw new ForbiddenException(
          `Cashfree Verification Error (${errorCode || '403 Forbidden'}): ${errorMessage}`,
        );
      }

      if (response.status === 401) {
        throw new UnauthorizedException(
          `Cashfree Authentication Error (${errorCode || '401 Unauthorized'}): ${errorMessage}`,
        );
      }

      if (response.status === 404) {
        throw new NotFoundException(
          `Vehicle RC record not found (${errorCode || '404 Not Found'}): ${errorMessage}`,
        );
      }

      throw new BadGatewayException(
        `Cashfree Service Error (${response.status}): ${errorMessage}`,
      );
    }

    // Record success and cache result
    await this.rateLimiter.recordHit({
      vehicleNumber,
      dealerId: effectiveDealerId,
      verificationId,
      status: 'SUCCESS',
      statusCode: response.status,
      data: responseData as ICashfreeVehicleRcResponse,
    });

    return responseData as ICashfreeVehicleRcResponse;
  }
}
