import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IMailService } from './interfaces/mail.interface';
import { SendMailDto } from './types/send-mail.dto';
import { MailResponseDto } from './types/mail-response.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Main mail service that acts as a facade/context for the Strategy pattern
 * Delegates all email operations to the configured mail provider
 *
 * @remarks
 * This service allows easy switching between different mail providers
 * (Nodemailer/SMTP, SendGrid, AWS SES, etc.) without changing client code
 *
 * @example
 * ```typescript
 * constructor(private readonly mailService: MailService) {}
 *
 * async sendWelcomeEmail(email: string) {
 *   const result = await this.mailService.sendMailAsync({
 *     to: email,
 *     subject: 'Welcome!',
 *     text: 'Welcome to our platform',
 *     html: '<h1>Welcome to our platform</h1>'
 *   });
 *   return result;
 * }
 * ```
 */
@Injectable()
export class MailService implements IMailService {
  constructor(
    @Inject('MAIL_PROVIDER')
    private readonly mailProvider: IMailService,
  ) {}

  /**
   * Validates a SendMailDto instance using class-validator decorators.
   * Converts plain objects to class instances to ensure decorator metadata is available.
   * @throws {BadRequestException} If validation fails
   */
  private async validateDto(dto: SendMailDto): Promise<void> {
    const instance = plainToInstance(SendMailDto, dto);
    const errors = await validate(instance);
    if (errors.length > 0) {
      const messages = errors.flatMap(
        (err) => Object.values(err.constraints ?? {}),
      );
      throw new BadRequestException(messages);
    }
  }

  /**
   * {@inheritDoc IMailService.sendMailAsync}
   */
  async sendMailAsync(sendMailDto: SendMailDto): Promise<MailResponseDto> {
    await this.validateDto(sendMailDto);
    return this.mailProvider.sendMailAsync(sendMailDto);
  }

  /**
   * {@inheritDoc IMailService.verifyConnectionAsync}
   */
  async verifyConnectionAsync(): Promise<boolean> {
    return this.mailProvider.verifyConnectionAsync();
  }

  /**
   * {@inheritDoc IMailService.sendBulkMailAsync}
   */
  async sendBulkMailAsync(sendMailDtos: SendMailDto[]): Promise<MailResponseDto[]> {
    // Validate all DTOs before sending any
    for (const [index, dto] of sendMailDtos.entries()) {
      try {
        await this.validateDto(dto);
      } catch (error) {
        throw new BadRequestException(
          `Validation failed for mail at index ${index}: ${error.message}`,
        );
      }
    }

    return await this.mailProvider.sendBulkMailAsync(sendMailDtos);
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use sendMailAsync instead
   */
  async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
    await this.sendMailAsync({ to, subject, text, html });
  }
}
