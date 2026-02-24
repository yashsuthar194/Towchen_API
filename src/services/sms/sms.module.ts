import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { SmsProvider } from 'src/core/config/namespaces/sms.config';
import { TwilioSmsService } from './providers/twilio-sms.service';

/**
 * SMS module providing messaging services
 *
 * @remarks
 * This module uses the Strategy pattern to allow switching between different SMS providers.
 * The current implementation supports Twilio, with easy extension for AWS SNS, Vonage, etc.
 *
 * Environment variables required:
 * - SMS_PROVIDER (optional, defaults to 'twilio')
 * - TWILIO_ACCOUNT_SID (for Twilio)
 * - TWILIO_AUTH_TOKEN (for Twilio)
 * - TWILIO_PHONE_NUMBER (for Twilio)
 *
 * @example
 * Import in your module:
 * ```typescript
 * @Module({
 *   imports: [SmsModule],
 *   controllers: [OtpController],
 *   providers: [OtpService],
 * })
 * export class OtpModule {}
 * ```
 *
 * Use in your service:
 * ```typescript
 * constructor(private readonly smsService: SmsService) {}
 * ```
 */
@Module({
  providers: [
    {
      provide: 'SMS_PROVIDER',
      useFactory: (config: TypedConfigService) => {
        const provider = config.sms.SMS_PROVIDER;

        switch (provider) {
          case SmsProvider.Twilio:
            return new TwilioSmsService(config);
          // case SmsProvider.AWSSNS:
          //   return new AwsSnsService(config);
          // case SmsProvider.Vonage:
          //   return new VonageService(config);
          default:
            return new TwilioSmsService(config);
        }
      },
      inject: [TypedConfigService],
    },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
