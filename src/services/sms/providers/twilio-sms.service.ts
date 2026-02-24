import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';
import { ISmsService } from '../interfaces/sms.interface';
import { SendSmsDto } from '../types/send-sms.dto';
import { SmsResponseDto } from '../types/sms-response.dto';
import { TypedConfigService } from 'src/core/config/typed-config.service';

/**
 * Twilio SMS service implementation
 * Implements ISmsService using Twilio's messaging API
 *
 * @remarks
 * Twilio is a leading cloud communications platform with global coverage
 * and support for SMS, MMS, and WhatsApp messaging.
 *
 * @example
 * Environment variables required:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 */
@Injectable()
export class TwilioSmsService implements ISmsService {
  private readonly logger = new Logger(TwilioSmsService.name);
  private readonly client: Twilio;
  private readonly defaultFromNumber: string;

  constructor(private readonly configService: TypedConfigService) {
    const smsConfig = this.configService.sms;

    this.defaultFromNumber = smsConfig.TWILIO_PHONE_NUMBER || '';

    // Validate required configuration
    if (!smsConfig.TWILIO_ACCOUNT_SID || !smsConfig.TWILIO_AUTH_TOKEN) {
      const errorMsg =
        'Twilio configuration incomplete: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.client = new Twilio(
      smsConfig.TWILIO_ACCOUNT_SID,
      smsConfig.TWILIO_AUTH_TOKEN,
    );

    this.logger.log('Twilio SMS service initialized');
  }

  async sendSmsAsync(sendSmsDto: SendSmsDto): Promise<SmsResponseDto> {
    try {
      const from = sendSmsDto.from || this.defaultFromNumber;

      if (!from) {
        throw new Error('From phone number is required but not configured');
      }

      const messageOptions: any = {
        body: sendSmsDto.message,
        from,
        to: sendSmsDto.to,
      };

      // Add media URL for MMS if provided
      if (sendSmsDto.mediaUrl) {
        messageOptions.mediaUrl = [sendSmsDto.mediaUrl];
      }

      const message = await this.client.messages.create(messageOptions);

      this.logger.log(
        `SMS sent successfully to ${sendSmsDto.to} - MessageSid: ${message.sid}`,
      );

      return {
        messageId: message.sid,
        success: true,
        recipient: sendSmsDto.to,
        status: this.mapTwilioStatus(message.status),
        metadata: {
          accountSid: message.accountSid,
          numSegments: message.numSegments,
          price: message.price,
          priceUnit: message.priceUnit,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to ${sendSmsDto.to}: ${error.message}`,
      );

      return {
        messageId: '',
        success: false,
        recipient: sendSmsDto.to,
        status: 'failed',
        errorMessage: error.message,
      };
    }
  }

  async verifyConnectionAsync(): Promise<boolean> {
    try {
      // Validate account by fetching account details
      await this.client.api.accounts(this.client.accountSid).fetch();
      this.logger.log('Twilio connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `Twilio connection verification failed: ${error.message}`,
      );
      throw error;
    }
  }

  async sendBulkSmsAsync(sendSmsDtos: SendSmsDto[]): Promise<SmsResponseDto[]> {
    // Twilio doesn't have native bulk API, so we send sequentially
    const results: SmsResponseDto[] = [];

    for (const smsDto of sendSmsDtos) {
      const result = await this.sendSmsAsync(smsDto);
      results.push(result);
    }

    return results;
  }

  async getMessageStatusAsync(messageId: string): Promise<{
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
    errorMessage?: string;
  }> {
    try {
      const message = await this.client.messages(messageId).fetch();
      return {
        status: this.mapTwilioStatus(message.status),
        errorMessage: message.errorMessage || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch message status: ${error.message}`);
      throw error;
    }
  }

  private mapTwilioStatus(
    twilioStatus: string,
  ): 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered' {
    switch (twilioStatus) {
      case 'queued':
      case 'accepted':
        return 'queued';
      case 'sending':
      case 'sent':
        return 'sent';
      case 'delivered':
        return 'delivered';
      case 'failed':
        return 'failed';
      case 'undelivered':
        return 'undelivered';
      default:
        return 'queued';
    }
  }
}
