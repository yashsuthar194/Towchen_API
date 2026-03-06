import {
    BadRequestException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { SmsService } from 'src/services/sms/sms.service';
import { JwtService } from 'src/services/jwt/jwt.service';
import { Utility } from 'src/shared/helper/utility';
import { OtpType, Role } from '@prisma/client';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerOtpVerificationDto } from './dto/customer-otp-verification.dto';
import { CustomerLoginResponseDto } from './dto/customer-login-response.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';

/** OTP length and expiry for login */
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;

@Injectable()
export class CustomerAuthService {
    constructor(
        private readonly _prismaService: PrismaService,
        private readonly _smsService: SmsService,
        private readonly _jwtService: JwtService,
    ) { }

    /**
     * Sends a login OTP to the customer's mobile number
     * @param loginDto Contains the customer's mobile number
     */
    async sendLoginOtpAsync(loginDto: CustomerLoginDto): Promise<ResponseDto<null>> {
        // Remove existence check to allow any number to receive OTP

        // 2. Generate OTP
        const otpCode = Utility.generateOtp(OTP_LENGTH);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // 3. Save to OTP table
        await this._prismaService.otp.create({
            data: {
                otp: otpCode.toString(),
                number: loginDto.number,
                type: OtpType.Number,
                expires_at: expiresAt,
            },
        });

        // 4. Send SMS
        const smsResponse = await this._smsService.sendSmsAsync({
            to: `+91${loginDto.number}`,
            message: `Your login OTP is ${otpCode}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
        });

        if (!smsResponse?.success) {
            throw new BadRequestException('Failed to send OTP via SMS. Please try again.');
        }

        return ResponseDto.success('OTP sent successfully');
    }

    /**
     * Verifies the login OTP and returns JWT tokens
     * @param verificationDto Contains the number and OTP
     */
    async verifyLoginOtpAsync(
        verificationDto: CustomerOtpVerificationDto,
    ): Promise<ResponseDto<CustomerLoginResponseDto>> {
        const customer = await this._prismaService.customer.findFirst({
            where: {
                number: verificationDto.number,
                is_deleted: false,
            },
        });

        // 1. Get the latest OTP for this number
        const dbOtp = await this._prismaService.otp.findFirst({
            where: {
                number: verificationDto.number,
                type: OtpType.Number,
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        // 2. Validate OTP
        if (!dbOtp || dbOtp.otp !== verificationDto.otp) {
            throw new BadRequestException('Invalid OTP');
        }

        if (dbOtp.expires_at < new Date()) {
            throw new BadRequestException('OTP has expired');
        }

        // 3. Generate tokens if customer exists
        if (customer) {
            const tokens = await this._jwtService.generateTokens({
                id: customer.id,
                email: customer.email,
                type: Role.Customer,
            });

            return ResponseDto.success('Login successful', {
                ...tokens,
                is_registered: true,
            });
        }

        // If customer doesn't exist, return verified but not registered
        return ResponseDto.success('Verification successful', {
            is_registered: false,
        });
    }
}
