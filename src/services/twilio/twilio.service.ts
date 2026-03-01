import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';
import { TypedConfigService } from 'src/core/config/typed-config.service';

@Injectable()
export class TwilioService {
    private readonly client: Twilio;
    private readonly logger = new Logger(TwilioService.name);

    constructor(private readonly typedConfig: TypedConfigService) {
        const { TWILIO_ACCOUNT_SID: accountSid, TWILIO_AUTH_TOKEN: authToken } = this.typedConfig.verification;

        if (!accountSid || !authToken) {
            this.logger.warn('Twilio credentials are not fully configured.');
        } else {
            this.client = new Twilio(accountSid, authToken);
        }
    }

    async sendSms(to: string, message: string): Promise<void> {
        const from = this.typedConfig.verification.TWILIO_PHONE_NUMBER;

        if (!this.client || !from) {
            this.logger.error('Twilio client is not initialized or sender number is missing.');
            throw new Error('SMS service unavailable');
        }

        try {
            await this.client.messages.create({
                body: message,
                from,
                to,
            });
            this.logger.log(`SMS sent successfully to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${to}: ${error.message}`);
            throw error;
        }
    }
}
