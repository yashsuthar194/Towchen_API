import { SendSmsDto } from '../types/send-sms.dto';
import { SmsResponseDto } from '../types/sms-response.dto';

/**
 * Interface defining the contract for all SMS service providers
 * Implements the Strategy pattern to allow switching between different SMS providers
 * (Twilio, AWS SNS, Vonage, MessageBird, etc.)
 */
export interface ISmsService {
  /**
   * Sends an SMS message using the configured provider
   *
   * @param sendSmsDto - SMS data including recipient and message
   * @returns Promise resolving to SMS response with messageId and status
   * @throws {Error} If SMS sending fails
   *
   * @example
   * ```typescript
   * const result = await smsService.sendSmsAsync({
   *   to: '+1234567890',
   *   message: 'Your verification code is: 123456'
   * });
   * ```
   */
  sendSmsAsync(sendSmsDto: SendSmsDto): Promise<SmsResponseDto>;

  /**
   * Verifies the SMS service connection and configuration
   *
   * @returns Promise resolving to true if connection is valid
   * @throws {Error} If verification fails
   *
   * @example
   * ```typescript
   * const isValid = await smsService.verifyConnectionAsync();
   * ```
   */
  verifyConnectionAsync(): Promise<boolean>;

  /**
   * Sends bulk SMS messages to multiple recipients
   * Optional method for providers that support batch sending
   *
   * @param sendSmsDtos - Array of SMS data
   * @returns Promise resolving to array of SMS responses
   *
   * @example
   * ```typescript
   * const results = await smsService.sendBulkSmsAsync([
   *   { to: '+1234567890', message: 'Hello User 1' },
   *   { to: '+0987654321', message: 'Hello User 2' }
   * ]);
   * ```
   */
  sendBulkSmsAsync?(sendSmsDtos: SendSmsDto[]): Promise<SmsResponseDto[]>;

  /**
   * Gets the delivery status of a sent message
   * Optional method for providers that support status tracking
   *
   * @param messageId - Unique identifier of the message
   * @returns Promise resolving to delivery status
   *
   * @example
   * ```typescript
   * const status = await smsService.getMessageStatusAsync('SM123456');
   * ```
   */
  getMessageStatusAsync?(messageId: string): Promise<{
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
    errorMessage?: string;
  }>;
}
