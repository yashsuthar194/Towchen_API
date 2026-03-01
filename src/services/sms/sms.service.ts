import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ISmsService } from './interfaces/sms.interface';
import { SendSmsDto } from './types/send-sms.dto';
import { SmsResponseDto } from './types/sms-response.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Main SMS service that acts as a facade/context for the Strategy pattern
 * Delegates all SMS operations to the configured SMS provider
 *
 * @remarks
 * This service allows easy switching between different SMS providers
 * (Twilio, AWS SNS, Vonage, MessageBird, etc.) without changing client code
 *
 * @example
 * ```typescript
 * constructor(private readonly smsService: SmsService) {}
 *
 * async sendVerificationCode(phoneNumber: string, code: string) {
 *   const result = await this.smsService.sendSmsAsync({
 *     to: phoneNumber,
 *     message: `Your verification code is: ${code}`
 *   });
 *   return result;
 * }
 * ```
 */
@Injectable()
export class SmsService implements ISmsService {
  constructor(
    @Inject('SMS_PROVIDER')
    private readonly smsProvider: ISmsService,
  ) {}

  /**
   * Validates a SendSmsDto instance using class-validator decorators.
   * Converts plain objects to class instances to ensure decorator metadata is available.
   * @throws {BadRequestException} If validation fails
   */
  private async validateDto(dto: SendSmsDto): Promise<void> {
    const instance = plainToInstance(SendSmsDto, dto);
    const errors = await validate(instance);
    if (errors.length > 0) {
      const messages = errors.flatMap(
        (err) => Object.values(err.constraints ?? {}),
      );
      throw new BadRequestException(messages);
    }
  }

  /**
   * {@inheritDoc ISmsService.sendSmsAsync}
   */
  async sendSmsAsync(sendSmsDto: SendSmsDto): Promise<SmsResponseDto> {
    await this.validateDto(sendSmsDto);
    return this.smsProvider.sendSmsAsync(sendSmsDto);
  }

  /**
   * {@inheritDoc ISmsService.verifyConnectionAsync}
   */
  async verifyConnectionAsync(): Promise<boolean> {
    return this.smsProvider.verifyConnectionAsync();
  }

  /**
   * {@inheritDoc ISmsService.sendBulkSmsAsync}
   */
  async sendBulkSmsAsync(sendSmsDtos: SendSmsDto[]): Promise<SmsResponseDto[]> {
    // Validate all DTOs before sending any
    for (const [index, dto] of sendSmsDtos.entries()) {
      try {
        await this.validateDto(dto);
      } catch (error) {
        throw new BadRequestException(
          `Validation failed for SMS at index ${index}: ${error.message}`,
        );
      }
    }

    if (this.smsProvider.sendBulkSmsAsync) {
      return this.smsProvider.sendBulkSmsAsync(sendSmsDtos);
    }

    // Fallback to sequential sending if bulk not supported
    const results: SmsResponseDto[] = [];
    for (const smsDto of sendSmsDtos) {
      const result = await this.sendSmsAsync(smsDto);
      results.push(result);
    }
    return results;
  }

  /**
   * {@inheritDoc ISmsService.getMessageStatusAsync}
   */
  async getMessageStatusAsync(messageId: string): Promise<{
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
    errorMessage?: string;
  }> {
    if (this.smsProvider.getMessageStatusAsync) {
      return this.smsProvider.getMessageStatusAsync(messageId);
    }

    throw new Error(
      'Message status tracking not supported by current provider',
    );
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use sendSmsAsync instead
   */
  async sendSms(to: string, message: string): Promise<void> {
    await this.sendSmsAsync({ to, message });
  }
}
