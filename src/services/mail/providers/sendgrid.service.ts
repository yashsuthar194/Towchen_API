import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { IMailService } from '../interfaces/mail.interface';
import { SendMailDto } from '../types/send-mail.dto';
import { MailResponseDto } from '../types/mail-response.dto';
import { TypedConfigService } from 'src/core/config/typed-config.service';

/**
 * SendGrid mail service implementation
 * Implements IMailService using the SendGrid Web API v3
 *
 * @remarks
 * SendGrid is a cloud-based email service that provides reliable transactional
 * and marketing email delivery, scalability, and real-time analytics.
 *
 * @example
 * Environment variables required:
 * - MAIL_PROVIDER=sendgrid
 * - SENDGRID_API_KEY=SG.xxxxxxxxxxxx
 * - MAIL_FROM=noreply@yourdomain.com   (must be a verified sender in SendGrid)
 */
@Injectable()
export class SendGridService implements IMailService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly defaultFrom: string;

  constructor(private readonly configService: TypedConfigService) {
    const mailConfig = this.configService.mail;
    const apiKey = mailConfig.sendgridApiKey;

    if (!apiKey) {
      const errorMsg =
        'SendGrid configuration incomplete: SENDGRID_API_KEY is required';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    sgMail.setApiKey(apiKey);
    this.defaultFrom = mailConfig.defaultFrom || '';

    this.logger.log('SendGrid service initialized');
  }

  async sendMailAsync(sendMailDto: SendMailDto): Promise<MailResponseDto> {
    try {
      const from = sendMailDto.from || this.defaultFrom;

      if (!from) {
        throw new Error('From address is required but not configured');
      }

      const [response] = await sgMail.send({
        from,
        to: sendMailDto.to,
        cc: sendMailDto.cc,
        bcc: sendMailDto.bcc,
        subject: sendMailDto.subject,
        text: sendMailDto.text,
        html: sendMailDto.html,
        attachments: sendMailDto.attachments?.map((att) => ({
          filename: att.filename,
          content: (att.content instanceof Buffer
            ? att.content.toString('base64')
            : att.content ?? '') as string,
          type: att.contentType ?? 'application/octet-stream',
          disposition: 'attachment' as const,
          encoding: att.content instanceof Buffer ? ('base64' as const) : undefined,
        })),
      });

      const messageId =
        (response.headers?.['x-message-id'] as string) ?? '';

      this.logger.log(
        `Email sent successfully to ${sendMailDto.to} - MessageId: ${messageId}`,
      );

      return {
        messageId,
        success: true,
        recipient: sendMailDto.to,
        metadata: {
          statusCode: response.statusCode,
          provider: 'sendgrid',
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${sendMailDto.to}: ${error.message}`,
      );
      throw error;
    }
  }

  async verifyConnectionAsync(): Promise<boolean> {
    try {
      // SendGrid has no dedicated ping endpoint.
      // We verify by confirming the API key is set and non-empty.
      const apiKey = this.configService.mail.sendgridApiKey;
      if (!apiKey) {
        throw new Error('SENDGRID_API_KEY is not configured');
      }
      this.logger.log('SendGrid API key verified successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `SendGrid API connection verification failed: ${error.message}`,
      );
      throw error;
    }
  }

  async sendBulkMailAsync(
    sendMailDtos: SendMailDto[],
  ): Promise<MailResponseDto[]> {
    const results: MailResponseDto[] = [];

    for (const mailDto of sendMailDtos) {
      try {
        const result = await this.sendMailAsync(mailDto);
        results.push(result);
      } catch (error) {
        results.push({
          messageId: '',
          success: false,
          recipient: mailDto.to,
          metadata: { error: error.message, provider: 'sendgrid' },
        });
      }
    }

    return results;
  }
}
