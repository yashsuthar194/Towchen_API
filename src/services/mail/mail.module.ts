import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { MailProvider } from 'src/core/config/namespaces/mail.config';
import { NodemailerService } from './providers/nodemailer.service';
import { ResendService } from './providers/resend.service';
import { SendGridService } from './providers/sendgrid.service';

/**
 * Mail module providing email services
 *
 * @remarks
 * This module uses the Strategy pattern to allow switching between different mail providers.
 * The current implementation supports Nodemailer/SMTP, with easy extension for SendGrid, AWS SES, etc.
 *
 * Environment variables required:
 * - MAIL_PROVIDER (optional, defaults to 'nodemailer')
 * - MAIL_HOST (for nodemailer)
 * - MAIL_PORT (for nodemailer)
 * - MAIL_USER (for nodemailer)
 * - MAIL_PASS (for nodemailer)
 * - MAIL_FROM (optional)
 *
 * @example
 * Import in your module:
 * ```typescript
 * @Module({
 *   imports: [MailModule],
 *   controllers: [OtpController],
 *   providers: [OtpService],
 * })
 * export class OtpModule {}
 * ```
 *
 * Use in your service:
 * ```typescript
 * constructor(private readonly mailService: MailService) {}
 * ```
 */
@Module({
  providers: [
    {
      provide: 'MAIL_PROVIDER',
      useFactory: (config: TypedConfigService) => {
        const provider = config.mail.MAIL_PROVIDER;
        
        switch (provider) {
          case MailProvider.Nodemailer:
            return new NodemailerService(config);
          case MailProvider.Resend:
            return new ResendService(config);
          case MailProvider.SendGrid:
            return new SendGridService(config);
          // case MailProvider.AWSSES:
          //   return new AwsSesService(config);
          default:
            return new NodemailerService(config);
        }
      },
      inject: [TypedConfigService],
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
