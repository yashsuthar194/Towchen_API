import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { OtpType } from 'generated/prisma/client';

@ApiTags('Email OTP')
@Controller('otp/email')
export class EmailOtpController {
    constructor(private readonly _otpService: OtpService) { }

    @Post('send-otp')
    @ApiOperation({ summary: 'Send OTP to an email address' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'user@example.com' },
            },
            required: ['email'],
        },
    })
    async sendOtp(@Body('email') email: string) {
        return this._otpService.sendOtp(email, OtpType.Email);
    }

    @Post('verify-otp')
    @ApiOperation({ summary: 'Verify an OTP for an email address' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                otp: { type: 'string', example: '482917' },
            },
            required: ['email', 'otp'],
        },
    })
    async verifyOtp(
        @Body('email') email: string,
        @Body('otp') otp: string,
    ) {
        return this._otpService.verifyOtp(email, otp, OtpType.Email);
    }
}
