import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { TwilioService } from 'src/services/twilio/twilio.service';
import { MailService } from 'src/services/mail/mail.service';
import { OtpType } from 'generated/prisma/client';

@Injectable()
export class OtpService {
    constructor(
        private readonly _prismaService: PrismaService,
        private readonly _twilioService: TwilioService,
        private readonly _mailService: MailService,
    ) { }

    /**
     * Generates a 6-character random alphanumeric OTP
     * @returns Generated OTP
     */
    private generateOtp(): string {
        const chars = '0123456789';
        let otp = '';
        for (let i = 0; i < 6; i++) {
            otp += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return otp;
    }

    /**
     * Sends an OTP to a identifier (phone number or email) and saves it to the database
     * @param identifier - Phone number or email
     * @param type - Type of OTP (Number or Email)
     */
    async sendOtp(identifier: string, type: OtpType = OtpType.Number): Promise<{ message: string }> {
        if (!identifier) {
            throw new BadRequestException(`${type === OtpType.Number ? 'Phone number' : 'Email'} is required`);
        }

        const otpCode = this.generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

        // Always create a new OTP entry
        await this._prismaService.otp.create({
            data: {
                number: type === OtpType.Number ? identifier : null,
                email: type === OtpType.Email ? identifier : null,
                type,
                otp: otpCode,
                expires_at: expiresAt,
            },
        });

        // Send OTP via correct channel
        if (type === OtpType.Number) {
            const message = `Your Towchen verification code is: ${otpCode}. Valid for 5 minutes.`;
            await this._twilioService.sendSms(identifier, message);
        } else if (type === OtpType.Email) {
            const subject = 'Your Towchen Verification Code';
            const text = `Your Towchen verification code is: ${otpCode}. Valid for 5 minutes.`;
            const html = `<p>Your Towchen verification code is: <strong>${otpCode}</strong>.</p><p>Valid for 5 minutes.</p>`;
            await this._mailService.sendMail(identifier, subject, text, html);
        }

        return { message: 'OTP sent successfully' };
    }

    /**
     * Verifies the latest OTP for a given identifier
     * @param identifier - Phone number or email
     * @param otp - OTP to verify
     * @param type - Type of OTP (Number or Email)
     */
    async verifyOtp(identifier: string, otp: string, type: OtpType = OtpType.Number): Promise<{ verified: boolean }> {
        if (!identifier || !otp) {
            throw new BadRequestException(`${type === OtpType.Number ? 'Phone number' : 'Email'} and OTP are required`);
        }

        // Find the latest OTP entry for this identifier and type
        const record = await this._prismaService.otp.findFirst({
            where: {
                OR: [
                    { number: type === OtpType.Number ? identifier : undefined },
                    { email: type === OtpType.Email ? identifier : undefined },
                ],
                type,
            },
            orderBy: { created_at: 'desc' },
        });

        if (!record) {
            throw new BadRequestException('No OTP found');
        }

        if (new Date() > record.expires_at) {
            throw new BadRequestException('OTP has expired');
        }

        if (record.otp !== otp) {
            throw new BadRequestException('Invalid OTP');
        }

        return { verified: true };
    }
    /**
     * Sends both Mobile and Email OTPs for identity verification
     * @param number - Mobile number
     * @param email - Email address
     */
    async requestVerificationOtps(number: string, email: string): Promise<{ message: string }> {
        // Send both OTPs in parallel
        await Promise.all([
            this.sendOtp(number, OtpType.Number),
            this.sendOtp(email, OtpType.Email),
        ]);

        return { message: 'Verification OTPs sent to both mobile number and email' };
    }

    /**
     * Verifies both Mobile and Email OTPs
     * @param number - Mobile number
     * @param numberOtp - OTP sent to mobile
     * @param email - Email address
     * @param emailOtp - OTP sent to email
     */
    async confirmVerificationOtps(
        number: string,
        numberOtp: string,
        email: string,
        emailOtp: string,
    ): Promise<{ verified: boolean }> {
        // Verify both in parallel
        const [numberResult, emailResult] = await Promise.all([
            this.verifyOtp(number, numberOtp, OtpType.Number),
            this.verifyOtp(email, emailOtp, OtpType.Email),
        ]);

        if (numberResult.verified && emailResult.verified) {
            return { verified: true };
        }

        return { verified: false };
    }
}
