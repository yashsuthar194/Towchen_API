import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { TypedConfigService } from 'src/core/config/typed-config.service';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly typedConfig: TypedConfigService) {
        const { MAIL_HOST: host, MAIL_PORT: port, MAIL_USER: user, MAIL_PASS: pass } = this.typedConfig.verification;

        if (!host || !user || !pass) {
            this.logger.warn('Mail credentials are not fully configured.');
        } else {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465, // true for 465, false for other ports
                auth: {
                    user,
                    pass,
                },
            });
        }
    }

    async sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
        const from = this.typedConfig.verification.MAIL_FROM || this.typedConfig.verification.MAIL_USER;

        if (!this.transporter) {
            this.logger.error('Mail transporter is not initialized.');
            throw new Error('Mail service unavailable');
        }

        try {
            await this.transporter.sendMail({
                from,
                to,
                subject,
                text,
                html,
            });
            this.logger.log(`Email sent successfully to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            throw error;
        }
    }
}
