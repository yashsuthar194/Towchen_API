import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { IMailService } from '../interfaces/mail.interface';
import { SendMailDto } from '../types/send-mail.dto';
import { MailResponseDto } from '../types/mail-response.dto';
import { TypedConfigService } from 'src/core/config/typed-config.service';

/**
 * Resend mail service implementation
 * Implements IMailService using the Resend API (https://resend.com)
 *
 * @remarks
 * Resend is a developer-first transactional email API. It provides:
 * - High deliverability (built on top of AWS SES)
 * - Native batch sending support via `resend.batch.send()`
 * - Simple React/HTML template support
 *
 * @example
 * Environment variables required:
 * - MAIL_PROVIDER=resend
 * - RESEND_API_KEY=re_xxxxxxxxxxxx
 * - MAIL_FROM=noreply@yourdomain.com   (must be a verified Resend domain)
 *
 * During development you can use: MAIL_FROM=onboarding@resend.dev
 * (this only allows sending to your own Resend account email)
 */
@Injectable()
export class ResendService implements IMailService {
  private readonly logger = new Logger(ResendService.name);
  private readonly resend: Resend;
  private readonly defaultFrom: string;

  constructor(private readonly configService: TypedConfigService) {
    const mailConfig = this.configService.mail;
    const apiKey = mailConfig.resendApiKey;

    if (!apiKey) {
      const errorMsg =
        'Resend configuration incomplete: RESEND_API_KEY is required';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.resend = new Resend(apiKey);
    this.defaultFrom = mailConfig.defaultFrom || 'onboarding@resend.dev';

    this.logger.log('Resend service initialized');
  }

  async sendMailAsync(sendMailDto: SendMailDto): Promise<MailResponseDto> {
    try {
      const from = sendMailDto.from || this.defaultFrom;

      const { data, error } = await this.resend.emails.send({
        from,
        to: sendMailDto.to,
        cc: sendMailDto.cc,
        bcc: sendMailDto.bcc,
        subject: sendMailDto.subject,
        text: sendMailDto.text,
        html: sendMailDto.html,
        attachments: sendMailDto.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          path: att.path,
          content_type: att.contentType,
        })),
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(
        `Email sent successfully to ${sendMailDto.to} - MessageId: ${data?.id}`,
      );

      return {
        messageId: data?.id ?? '',
        success: true,
        recipient: sendMailDto.to,
        metadata: { provider: 'resend' },
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
      // Resend does not expose a dedicated ping/verify endpoint.
      // We verify by fetching the list of domains (lightweight call).
      const { error } = await this.resend.domains.list();

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log('Resend API connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(
        `Resend API connection verification failed: ${error.message}`,
      );
      throw error;
    }
  }

  async sendBulkMailAsync(sendMailDtos: SendMailDto[]): Promise<MailResponseDto[]> {
    try {
      const from = this.defaultFrom;

      // Use Resend's native batch send for efficiency
      const { data, error } = await this.resend.batch.send(
        sendMailDtos.map((dto) => ({
          from: dto.from || from,
          to: dto.to,
          cc: dto.cc,
          bcc: dto.bcc,
          subject: dto.subject,
          text: dto.text,
          html: dto.html,
          attachments: dto.attachments?.map((att) => ({
            filename: att.filename,
            content: att.content,
            path: att.path,
            content_type: att.contentType,
          })),
        })),
      );

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`Bulk email sent: ${sendMailDtos.length} emails`);

      return (data?.data ?? []).map((item, index) => ({
        messageId: item.id,
        success: true,
        recipient: sendMailDtos[index].to,
        metadata: { provider: 'resend' },
      }));
    } catch (error) {
      this.logger.error(`Failed to send bulk emails: ${error.message}`);

      // Fall back to individual sends so partial failures are captured
      const results: MailResponseDto[] = [];
      for (const mailDto of sendMailDtos) {
        try {
          const result = await this.sendMailAsync(mailDto);
          results.push(result);
        } catch (err) {
          results.push({
            messageId: '',
            success: false,
            recipient: mailDto.to,
            metadata: { error: err.message, provider: 'resend' },
          });
        }
      }
      return results;
    }
  }
}
