import { Controller, Post, Body } from '@nestjs/common';
import { OtpService } from './otp.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { OtpType } from '@prisma/client';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
    constructor(private readonly _otpService: OtpService) { }

    @Post('send-otp')
    @ApiOperation({ summary: 'Send OTP to a phone number' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                number: { type: 'string', example: '+1234567890' },
            },
            required: ['number'],
        },
    })
    async sendOtp(@Body('number') number: string) {
        return this._otpService.sendOtp(number, OtpType.Number);
    }

    @Post('verify-otp')
    @ApiOperation({ summary: 'Verify an OTP for a phone number' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                number: { type: 'string', example: '+1234567890' },
                otp: { type: 'string', example: '482917' },
            },
            required: ['number', 'otp'],
        },
    })
    async verifyOtp(
        @Body('number') number: string,
        @Body('otp') otp: string,
    ) {
        return this._otpService.verifyOtp(number, otp, OtpType.Number);
    }
}
