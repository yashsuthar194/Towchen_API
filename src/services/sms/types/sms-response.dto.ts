export class SmsResponseDto {
  /**
   * Unique message identifier from the SMS provider
   */
  messageId: string;

  /**
   * Status of the SMS send operation
   */
  success: boolean;

  /**
   * The phone number of the recipient
   */
  recipient: string;

  /**
   * Current delivery status
   */
  status?: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';

  /**
   * Provider-specific response data
   */
  metadata?: Record<string, any>;

  /**
   * Error message if sending failed
   */
  errorMessage?: string;
}
