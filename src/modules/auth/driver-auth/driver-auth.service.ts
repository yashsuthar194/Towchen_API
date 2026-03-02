import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { DriverLoginDto } from './dto/driver-login.dto';
import { Hash } from 'src/shared/helper/hash';
import { DriverLoginResponseDto } from './dto/driver-login-response.dto';
import { JwtService } from 'src/services/jwt/jwt.service';
import { OtpType, Role } from 'generated/prisma/enums';
import { Utility } from 'src/shared/helper/utility';
import { MailService } from 'src/services/mail/mail.service';
import { SmsService } from 'src/services/sms/sms.service';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { TemplateHelper } from 'src/shared/helper/template-helper';
import { DriverVerificationRequestDto } from './dto/driver-verification-request.dto';
import { DriverVerificationDto } from './dto/driver-verification.dto';

/** OTP code length */
const OTP_LENGTH = 6;

/** OTP expiration time in minutes */
const OTP_EXPIRY_MINUTES = 5;

@Injectable()
export class DriverAuthService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _jwtService: JwtService,
    private readonly _smsService: SmsService,
    private readonly _emailService: MailService,
  ) {}

  /**
   * Logs in a driver.
   * @param request The login request containing email and password.
   * @returns The login response containing access and refresh tokens, and verification statuses.
   */
  async loginAsync(request: DriverLoginDto): Promise<DriverLoginResponseDto> {
    const driver = await this._prismaService.driver.findFirst({
      where: {
        email: request.email,
        is_deleted: false,
      },
    });

    if (!driver) throw new NotFoundException('Invalid login credentials');

    const isPassVerified = await Hash.verifyAsync(
      request.password,
      driver.password,
    );

    if (!isPassVerified)
      throw new NotFoundException('Invalid login credentials');

    const tokens = await this._jwtService.generateTokens({
      id: driver.id,
      email: driver.email,
      type: Role.Driver,
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      is_email_verified: driver.is_email_verified,
      is_number_verified: driver.is_number_verified,
    };
  }

  /**
   * Send verification OTPs to the driver's email and mobile number.
   * @param request The request containing the driver's email and mobile number.
   * @returns A response indicating the success or failure of the OTP sending process.
   */
  async sendVerificationOtpAsync(request: DriverVerificationRequestDto) {
    const driver = await this._prismaService.driver.findFirst({
      where: {
        number: request.number,
        email: request.email,
        is_deleted: false,
      },
    });

    if (!driver) throw new NotFoundException('Driver not found');

    const smsOtp = Utility.generateOtp(OTP_LENGTH);
    const emailOtp = Utility.generateOtp(OTP_LENGTH);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const createdOtps = await this._prismaService.otp.createMany({
      data: [
        {
          otp: smsOtp.toString(),
          number: request.number,
          type: OtpType.Number,
          expires_at: expiresAt,
        },
        {
          otp: emailOtp.toString(),
          email: request.email,
          type: OtpType.Email,
          expires_at: expiresAt,
        },
      ],
    });

    if (createdOtps.count !== 2) {
      throw new BadRequestException('Failed to create OTPs');
    }

    const template = TemplateHelper.replaceVariables(
      TemplateHelper.getTemplate('otp'),
      {
        APP_NAME: 'Towchen Service',
        OTP: emailOtp,
        EXPIRY_MINUTES: OTP_EXPIRY_MINUTES,
        SUPPORT_EMAIL: 'support@towchen.com',
      },
    );

    const [smsResponse, emailResponse] = await Promise.all([
      this._smsService.sendSmsAsync({
        to: `+91${request.number}`,
        message: `Your OTP is ${smsOtp}`,
      }),
      this._emailService.sendMailAsync({
        to: request.email,
        subject: 'OTP verification',
        text: 'OTP verification email',
        html: template,
      }),
    ]);

    if (!smsResponse?.success || !emailResponse?.success) {
      throw new BadRequestException('Failed to send OTPs');
    }

    return new ResponseDto<null>(
      true,
      HttpStatus.OK,
      'OTPs sent successfully',
      null,
    );
  }

  /**
   * Verifies the OTPs for the driver's email and mobile number.
   * @param request The request containing the driver's email, mobile number, and OTPs.
   * @returns A response indicating the success or failure of the OTP verification process.
   */
  async verifyVerificationOtpAsync(request: DriverVerificationDto) {
    const [emailOtp, mobileOtp] = await Promise.all([
      this._prismaService.otp.findFirst({
        where: {
          email: request.email,
          type: OtpType.Email,
        },
        orderBy: {
          id: 'desc',
        },
      }),
      this._prismaService.otp.findFirst({
        where: {
          number: request.number,
          type: OtpType.Number,
        },
        orderBy: {
          id: 'desc',
        },
      }),
    ]);

    if (!mobileOtp || mobileOtp.otp !== request.number_otp.toString()) {
      throw new BadRequestException('Invalid mobile OTP');
    }

    if (!emailOtp || emailOtp.otp !== request.email_otp.toString()) {
      throw new BadRequestException('Invalid email OTP');
    }

    if (mobileOtp.expires_at < new Date()) {
      throw new BadRequestException('Mobile OTP expired');
    }

    if (emailOtp.expires_at < new Date()) {
      throw new BadRequestException('Email OTP expired');
    }

    const vendor = await this._prismaService.driver.findFirst({
      where: {
        number: request.number,
        email: request.email,
        is_deleted: false,
      },
    });

    if (!vendor) throw new NotFoundException('Driver not found');

    await this._prismaService.driver.update({
      data: {
        is_email_verified: true,
        is_number_verified: true,
      },
      where: {
        id: vendor.id,
      },
    });

    return new ResponseDto<null>(
      true,
      HttpStatus.OK,
      'OTPs verified successfully',
      null,
    );
  }
}
