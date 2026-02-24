import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Identity Verification')
@Controller('otp/verification')
export class VerificationOtpController {
    constructor(private readonly _otpService: OtpService) { }

    @Post('request')
    @ApiOperation({ summary: 'Request identity verification (SMS & Email OTP)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                number: { type: 'string', example: '+1234567890' },
                email: { type: 'string', example: 'user@example.com' },
            },
            required: ['number', 'email'],
        },
    })
    async requestVerification(@Body() body: { number: string; email: string }) {
        return this._otpService.requestVerificationOtps(body.number, body.email);
    }

    @Post('confirm')
    @ApiOperation({ summary: 'Confirm identity verification (Verify both OTPs)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                number: { type: 'string', example: '+1234567890' },
                numberOtp: { type: 'string', example: '123456' },
                email: { type: 'string', example: 'user@example.com' },
                emailOtp: { type: 'string', example: '654321' },
            },
            required: ['number', 'numberOtp', 'email', 'emailOtp'],
        },
    })
    async confirmVerification(
        @Body() body: { number: string; numberOtp: string; email: string; emailOtp: string },
    ) {
        return this._otpService.confirmVerificationOtps(
            body.number,
            body.numberOtp,
            body.email,
            body.emailOtp,
        );
    }
}
