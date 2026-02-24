import { SendMailDto } from '../types/send-mail.dto';
import { MailResponseDto } from '../types/mail-response.dto';

/**
 * Interface defining the contract for all mail service providers
 * Implements the Strategy pattern to allow switching between different email providers
 * (Nodemailer/SMTP, SendGrid, AWS SES, etc.)
 */
export interface IMailService {
  /**
   * Sends an email using the configured provider
   *
   * @param sendMailDto - Email data including recipient, subject, and content
   * @returns Promise resolving to mail response with messageId and status
   * @throws {Error} If email sending fails
   *
   * @example
   * ```typescript
   * const result = await mailService.sendMailAsync({
   *   to: 'user@example.com',
   *   subject: 'Welcome',
   *   text: 'Welcome to our service!',
   *   html: '<h1>Welcome to our service!</h1>'
   * });
   * ```
   */
  sendMailAsync(sendMailDto: SendMailDto): Promise<MailResponseDto>;

  /**
   * Verifies the mail service connection and configuration
   *
   * @returns Promise resolving to true if connection is valid
   * @throws {Error} If verification fails
   *
   * @example
   * ```typescript
   * const isValid = await mailService.verifyConnectionAsync();
   * ```
   */
  verifyConnectionAsync(): Promise<boolean>;

  /**
   * Sends a bulk email to multiple recipients
   * Method for providers that support batch sending
   *
   * @param sendMailDtos - Array of email data
   * @returns Promise resolving to array of mail responses
   *
   * @example
   * ```typescript
   * const results = await mailService.sendBulkMailAsync([
   *   { to: 'user1@example.com', subject: 'Test', text: 'Hello' },
   *   { to: 'user2@example.com', subject: 'Test', text: 'Hello' }
   * ]);
   * ```
   */
  sendBulkMailAsync(sendMailDtos: SendMailDto[]): Promise<MailResponseDto[]>;
}
