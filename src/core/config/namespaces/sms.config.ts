import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ConfigNamespace } from '../helper/config.decorator';
import { createConfigLoader } from '../helper/config.loader';

export enum SmsProvider {
  Twilio = 'twilio',
  AWSSNS = 'aws-sns',
  Vonage = 'vonage',
  MessageBird = 'messagebird',
}

@ConfigNamespace('sms')
export class SmsConfig {
  @IsEnum(SmsProvider, {
    message: `SMS_PROVIDER must be one of: ${Object.values(SmsProvider).join(', ')}`,
  })
  @IsOptional()
  SMS_PROVIDER: SmsProvider = SmsProvider.Twilio;

  // Twilio Configuration
  @IsString({ message: 'TWILIO_ACCOUNT_SID must be a string' })
  @IsOptional()
  TWILIO_ACCOUNT_SID?: string;

  @IsString({ message: 'TWILIO_AUTH_TOKEN must be a string' })
  @IsOptional()
  TWILIO_AUTH_TOKEN?: string;

  @IsString({ message: 'TWILIO_PHONE_NUMBER must be a string' })
  @IsOptional()
  TWILIO_PHONE_NUMBER?: string;

  // Computed properties for easier access
  get provider(): SmsProvider {
    return this.SMS_PROVIDER;
  }

  get defaultFromNumber(): string {
    switch (this.SMS_PROVIDER) {
      case SmsProvider.Twilio:
        return this.TWILIO_PHONE_NUMBER || '';
      default:
        return '';
    }
  }

  get accountSid(): string {
    return this.TWILIO_ACCOUNT_SID || '';
  }

  get authToken(): string {
    return this.TWILIO_AUTH_TOKEN || '';
  }

  get phoneNumber(): string {
    return this.TWILIO_PHONE_NUMBER || '';
  }
}

export const smsConfig = createConfigLoader(SmsConfig);
