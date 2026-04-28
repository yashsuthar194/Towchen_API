import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ConfigNamespace } from '../helper/config.decorator';
import { createConfigLoader } from '../helper/config.loader';

export enum MailProvider {
  Nodemailer = 'nodemailer',
  SendGrid = 'sendgrid',
  AWSSES = 'aws-ses',
  Resend = 'resend',
}

@ConfigNamespace('mail')
export class MailConfig {
  @IsEnum(MailProvider, {
    message: `MAIL_PROVIDER must be one of: ${Object.values(MailProvider).join(', ')}`,
  })
  @IsOptional()
  MAIL_PROVIDER: MailProvider = MailProvider.Nodemailer;

  // Nodemailer/SMTP Configuration
  @IsString({ message: 'MAIL_HOST must be a string' })
  @IsOptional()
  MAIL_HOST?: string;

  @IsInt({ message: 'MAIL_PORT must be an integer' })
  @Min(1)
  @Max(65535)
  @IsOptional()
  MAIL_PORT?: number;

  @IsString({ message: 'MAIL_USER must be a string' })
  @IsOptional()
  MAIL_USER?: string;

  @IsString({ message: 'MAIL_PASS must be a string' })
  @IsOptional()
  MAIL_PASS?: string;

  @IsString({ message: 'MAIL_FROM must be a string' })
  @IsOptional()
  MAIL_FROM?: string;

  // Resend Configuration
  @IsString({ message: 'RESEND_API_KEY must be a string' })
  @IsOptional()
  RESEND_API_KEY?: string;

  // SendGrid Configuration
  @IsString({ message: 'SENDGRID_API_KEY must be a string' })
  @IsOptional()
  SENDGRID_API_KEY?: string;

  // Computed properties for easier access
  get provider(): MailProvider {
    return this.MAIL_PROVIDER;
  }

  get defaultFrom(): string {
    return this.MAIL_FROM || this.MAIL_USER || '';
  }

  get host(): string {
    return this.MAIL_HOST || '';
  }

  get port(): number {
    return this.MAIL_PORT || 587;
  }

  get user(): string {
    return this.MAIL_USER || '';
  }

  get pass(): string {
    return this.MAIL_PASS || '';
  }

  get resendApiKey(): string {
    return this.RESEND_API_KEY || '';
  }

  get sendgridApiKey(): string {
    return this.SENDGRID_API_KEY || '';
  }
}

export const mailConfig = createConfigLoader(MailConfig);
