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
import { OtpType, Role } from '@prisma/client';
import { Utility } from 'src/shared/helper/utility';
import { MailService } from 'src/services/mail/mail.service';
import { SmsService } from 'src/services/sms/sms.service';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { TemplateHelper } from 'src/shared/helper/template-helper';
import { DriverVerificationRequestDto } from './dto/driver-verification-request.dto';
import { DriverVerificationDto } from './dto/driver-verification.dto';
import { DriverOtpLoginDto } from './dto/driver-otp-login.dto';
import { DriverOtpVerificationDto } from './dto/driver-otp-verification.dto';

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
   * Logs in a driver using formated_id and password.
   * @param request The login request containing formated_id and password.
   * @returns The login response containing access and refresh tokens.
   */
  async loginAsync(request: DriverLoginDto): Promise<DriverLoginResponseDto> {
    const driver = await this._prismaService.driver.findFirst({
      where: {
        formated_id: request.formated_id,
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
      is_documents_uploaded: this.checkDocumentsUploaded(driver),
    };
  }

  /**
   * Changes the password for an authenticated driver.
   */
  async changePasswordAsync(driverId: number, dto: any) {
    const driver = await this._prismaService.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) throw new NotFoundException('Driver not found');

    const isPassVerified = await Hash.verifyAsync(
      dto.old_password,
      driver.password,
    );

    if (!isPassVerified) {
      throw new BadRequestException('Incorrect old password');
    }

    const hashedPassword = await Hash.hashAsync(dto.new_password);

    await this._prismaService.driver.update({
      where: { id: driverId },
      data: { password: hashedPassword },
    });

    return ResponseDto.success('Password changed successfully');
  }

  /**
   * Sends a forgot password OTP to the driver's registered mobile number.
   */
  async sendForgotPasswordOtpAsync(dto: any) {
    const driver = await this._prismaService.driver.findFirst({
      where: {
        formated_id: dto.formated_id,
        is_deleted: false,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver with this ID not found');
    }

    const otpCode = Utility.generateOtp(OTP_LENGTH);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this._prismaService.otp.create({
      data: {
        otp: otpCode.toString(),
        number: driver.mobile_number,
        type: OtpType.Number,
        expires_at: expiresAt,
      },
    });

    const smsResponse = await this._smsService.sendSmsAsync({
      to: `+91${driver.mobile_number}`,
      message: `Your password reset OTP for Towchen is ${otpCode}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    });

    if (!smsResponse?.success) {
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }

    return ResponseDto.success(`OTP sent to registered mobile number ending in ${driver.mobile_number.slice(-4)}`);
  }

  /**
   * Resets the password using OTP.
   */
  async resetPasswordAsync(dto: any) {
    const driver = await this._prismaService.driver.findFirst({
      where: {
        formated_id: dto.formated_id,
        is_deleted: false,
      },
    });

    if (!driver) throw new NotFoundException('Driver not found');

    const dbOtp = await this._prismaService.otp.findFirst({
      where: {
        number: driver.mobile_number,
        type: OtpType.Number,
        otp: dto.otp,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!dbOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (dbOtp.expires_at < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    const hashedPassword = await Hash.hashAsync(dto.new_password);

    await this._prismaService.driver.update({
      where: { id: driver.id },
      data: { password: hashedPassword },
    });

    return ResponseDto.success('Password reset successfully. You can now login with your new password.');
  }

  /**
   * Send verification OTPs to the driver's email and mobile number.
   * @param request The request containing the driver's email and mobile number.
   * @returns A response indicating the success or failure of the OTP sending process.
   */
  async sendVerificationOtpAsync(request: DriverVerificationRequestDto) {
    let driver;

    if (request.formated_id) {
      driver = await this._prismaService.driver.findFirst({
        where: {
          formated_id: request.formated_id.trim(),
          is_deleted: false,
        },
      });
    } else if (request.email && request.number) {
      driver = await this._prismaService.driver.findFirst({
        where: {
          mobile_number: request.number.trim(),
          email: {
            equals: request.email.trim(),
            mode: 'insensitive',
          },
          is_deleted: false,
        },
      });
    }

    if (!driver) throw new NotFoundException('Driver not found');

    const smsOtp = Utility.generateOtp(OTP_LENGTH);
    const emailOtp = Utility.generateOtp(OTP_LENGTH);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const createdOtps = await this._prismaService.otp.createMany({
      data: [
        {
          otp: smsOtp.toString(),
          number: driver.mobile_number,
          type: OtpType.Number,
          expires_at: expiresAt,
        },
        {
          otp: emailOtp.toString(),
          email: driver.email,
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
        to: `+91${driver.mobile_number}`,
        message: `Your OTP is ${smsOtp}`,
      }),
      this._emailService.sendMailAsync({
        to: driver.email,
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
    let driver;

    if (request.formated_id) {
      driver = await this._prismaService.driver.findFirst({
        where: {
          formated_id: request.formated_id.trim(),
          is_deleted: false,
        },
      });
    } else if (request.email && request.number) {
      driver = await this._prismaService.driver.findFirst({
        where: {
          mobile_number: request.number.trim(),
          email: {
            equals: request.email.trim(),
            mode: 'insensitive',
          },
          is_deleted: false,
        },
      });
    }

    if (!driver) throw new NotFoundException('Driver not found');

    const [emailOtp, mobileOtp] = await Promise.all([
      this._prismaService.otp.findFirst({
        where: {
          email: driver.email,
          type: OtpType.Email,
        },
        orderBy: {
          id: 'desc',
        },
      }),
      this._prismaService.otp.findFirst({
        where: {
          number: driver.mobile_number,
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

    const now = new Date();
    if (mobileOtp.expires_at < now) {
      throw new BadRequestException('Mobile OTP expired');
    }

    if (emailOtp.expires_at < now) {
      throw new BadRequestException('Email OTP expired');
    }

    await this._prismaService.driver.update({
      data: {
        is_email_verified: true,
        is_number_verified: true,
      },
      where: {
        id: driver.id,
      },
    });

    return new ResponseDto<null>(
      true,
      HttpStatus.OK,
      'OTPs verified successfully',
      null,
    );
  }

  /**
   * Sends a login OTP to the driver's mobile number
   * @param dto Contains the driver's mobile number
   */
  async sendLoginOtpAsync(dto: DriverOtpLoginDto): Promise<ResponseDto<null>> {
    const driver = await this._prismaService.driver.findFirst({
      where: {
        mobile_number: dto.number,
        is_deleted: false,
      },
    });

    if (!driver) {
      throw new NotFoundException(
        'No driver found with this mobile number. Please register first.',
      );
    }

    const otpCode = Utility.generateOtp(OTP_LENGTH);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this._prismaService.otp.create({
      data: {
        otp: otpCode.toString(),
        number: dto.number,
        type: OtpType.Number,
        expires_at: expiresAt,
      },
    });

    const smsResponse = await this._smsService.sendSmsAsync({
      to: `+91${dto.number}`,
      message: `Your login OTP for Towchen is ${otpCode}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    });

    if (!smsResponse?.success) {
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }

    return ResponseDto.success('OTP sent successfully');
  }

  /**
   * Verifies the login OTP and returns JWT tokens
   * @param dto Contains the number and OTP
   */
  async verifyLoginOtpAsync(
    dto: DriverOtpVerificationDto,
  ): Promise<ResponseDto<DriverLoginResponseDto>> {
    const driver = await this._prismaService.driver.findFirst({
      where: {
        mobile_number: dto.number,
        is_deleted: false,
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const dbOtp = await this._prismaService.otp.findFirst({
      where: {
        number: dto.number,
        type: OtpType.Number,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!dbOtp || dbOtp.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (dbOtp.expires_at < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    const tokens = await this._jwtService.generateTokens({
      id: driver.id,
      email: driver.email,
      type: Role.Driver,
    });

    return ResponseDto.success('Login successful', {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      is_email_verified: driver.is_email_verified,
      is_number_verified: driver.is_number_verified,
      is_documents_uploaded: this.checkDocumentsUploaded(driver),
    });
  }

  /**
   * Helper to check if all required driver documents are uploaded.
   * @param driver The driver object from Prisma
   */
  private checkDocumentsUploaded(driver: any): boolean {
    return !!(
      driver.aadhar_card_url &&
      driver.pan_card_url &&
      driver.driver_license_url
    );
  }
}
