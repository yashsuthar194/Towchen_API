export class MailResponseDto {
  /**
   * Unique message identifier from the email provider
   */
  messageId: string;

  /**
   * Status of the email send operation
   */
  success: boolean;

  /**
   * The email address of the recipient
   */
  recipient: string;

  /**
   * Provider-specific response data
   */
  metadata?: Record<string, any>;
}
