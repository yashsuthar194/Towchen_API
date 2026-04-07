import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IMailService } from '../interfaces/mail.interface';
import { SendMailDto } from '../types/send-mail.dto';
import { MailResponseDto } from '../types/mail-response.dto';
import { TypedConfigService } from 'src/core/config/typed-config.service';

/**
 * Nodemailer/SMTP mail service implementation
 * Implements IMailService using SMTP protocol via nodemailer
 *
 * @remarks
 * This provider supports any SMTP server including Gmail, SendGrid SMTP,
 * Mailgun SMTP, and custom SMTP servers.
 *
 * @example
 * Environment variables required:
 * - MAIL_HOST
 * - MAIL_PORT
 * - MAIL_USER
 * - MAIL_PASS
 * - MAIL_FROM (optional)
 */
@Injectable()
export class NodemailerService implements IMailService {
  private readonly logger = new Logger(NodemailerService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly defaultFrom: string;

  constructor(private readonly configService: TypedConfigService) {
    const mailConfig = this.configService.mail;

    this.defaultFrom = mailConfig.defaultFrom;

    // Validate required configuration
    if (!mailConfig.MAIL_HOST || !mailConfig.MAIL_USER || !mailConfig.MAIL_PASS) {
      const errorMsg = 'Nodemailer configuration incomplete: MAIL_HOST, MAIL_USER, and MAIL_PASS are required';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.transporter = nodemailer.createTransport({
      host: mailConfig.MAIL_HOST,
      port: mailConfig.MAIL_PORT || 587,
      secure: mailConfig.MAIL_PORT === 465,
      auth: {
        user: mailConfig.MAIL_USER,
        pass: mailConfig.MAIL_PASS,
      },
      // Force IPv4 if IPv6 is unreachable (Common for ENETUNREACH errors)
      family: 4,
      connectionTimeout: 10000, // 10 seconds
      socketTimeout: 10000,     // 10 seconds
    } as any);

    this.logger.log('Nodemailer service initialized');
  }

  async sendMailAsync(sendMailDto: SendMailDto): Promise<MailResponseDto> {
    try {
      const from = sendMailDto.from || this.defaultFrom;

      if (!from) {
        throw new Error('From address is required but not configured');
      }

      const info = await this.transporter.sendMail({
        from,
        to: sendMailDto.to,
        cc: sendMailDto.cc,
        bcc: sendMailDto.bcc,
        subject: sendMailDto.subject,
        text: sendMailDto.text,
        html: sendMailDto.html,
        attachments: sendMailDto.attachments,
      });

      this.logger.log(`Email sent successfully to ${sendMailDto.to} - MessageId: ${info.messageId}`);

      return {
        messageId: info.messageId,
        success: true,
        recipient: sendMailDto.to,
        metadata: {
          response: info.response,
          envelope: info.envelope,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${sendMailDto.to}: ${error.message}`);
      throw error;
    }
  }

  async verifyConnectionAsync(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(`SMTP connection verification failed: ${error.message}`);
      throw error;
    }
  }

  async sendBulkMailAsync(sendMailDtos: SendMailDto[]): Promise<MailResponseDto[]> {
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
          metadata: { error: error.message },
        });
      }
    }

    return results;
  }
}
