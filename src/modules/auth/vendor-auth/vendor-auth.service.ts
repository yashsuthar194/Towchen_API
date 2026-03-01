import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { VendorAuthRequestDto } from './dto/vendor-auth-request.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { SmsService } from 'src/services/sms/sms.service';
import { MailService } from 'src/services/mail/mail.service';
import { Utility } from 'src/shared/helper/utility';
import { OtpType, Role } from '@prisma/client';
import { TemplateHelper } from 'src/shared/helper/template-helper';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { VendorAuthVerificationDto } from './dto/vendor-auth-verification.dto';
import { Hash } from 'src/shared/helper/hash';
import { VendorLoginDto } from './dto/vendor-login.dto';
import { VendorLoginResponseDto } from './dto/vendor-login-response.dto';
import { JwtService } from 'src/services/jwt/jwt.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

/** OTP code length */
const OTP_LENGTH = 6;

/** OTP expiration time in minutes */
const OTP_EXPIRY_MINUTES = 5;

/**
 * Service handling vendor authentication operations
 * including OTP generation, storage, and delivery.
 */
@Injectable()
export class VendorAuthService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _smsService: SmsService,
    private readonly _emailService: MailService,
    private readonly _jwtService: JwtService,
  ) { }

  //#region OTP
  /**
   * Generates and sends OTP codes to the vendor's phone number (via SMS)
   * and email address for registration verification.
   *
   * @param registrationDto - Contains the vendor's phone number and email.
   * @returns A response confirming that both OTPs were sent successfully.
   * @throws {BadRequestException} If OTP records fail to be created in the database.
   * @throws {BadRequestException} If either the SMS or email delivery fails.
   */
  async sendRegistrationOtpAsync(
    registrationDto: VendorAuthRequestDto,
  ): Promise<ResponseDto<null>> {
    const smsOtp = Utility.generateOtp(OTP_LENGTH);
    const emailOtp = Utility.generateOtp(OTP_LENGTH);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const createdOtps = await this._prismaService.otp.createMany({
      data: [
        {
          otp: smsOtp.toString(),
          number: registrationDto.number,
          type: OtpType.Number,
          expires_at: expiresAt,
        },
        {
          otp: emailOtp.toString(),
          email: registrationDto.email,
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
        to: `+91${registrationDto.number}`,
        message: `Your OTP is ${smsOtp}`,
      }),
      this._emailService.sendMailAsync({
        to: registrationDto.email,
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
   * Verifies the OTP codes sent to the vendor's phone number and email.
   *
   * @param verificationDto - Contains the vendor's phone number and email, and the OTP codes.
   * @returns A response indicating whether the OTP codes were verified successfully.
   * @throws {BadRequestException} If the OTP codes are invalid or expired.
   */
  async verifyRegistrationOtpAsync(verificationDto: VendorAuthVerificationDto) {
    const [emailOtp, mobileOtp] = await Promise.all([
      this._prismaService.otp.findFirst({
        where: {
          email: verificationDto.email,
          type: OtpType.Email,
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this._prismaService.otp.findFirst({
        where: {
          number: verificationDto.number,
          type: OtpType.Number,
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
    ]);

    if (!mobileOtp || mobileOtp.otp !== verificationDto.mobile_otp.toString()) {
      throw new BadRequestException('Invalid mobile OTP');
    }

    if (!emailOtp || emailOtp.otp !== verificationDto.email_otp.toString()) {
      throw new BadRequestException('Invalid email OTP');
    }

    if (mobileOtp.expires_at < new Date()) {
      throw new BadRequestException('Mobile OTP expired');
    }

    if (emailOtp.expires_at < new Date()) {
      throw new BadRequestException('Email OTP expired');
    }

    return new ResponseDto<null>(
      true,
      HttpStatus.OK,
      'OTPs verified successfully',
      null,
    );
  }
  //#endregion

  //#region Login
  /**
   * Logs in a vendor using their email and password.
   * @param loginDto - Contains the vendor's email and password.
   * @returns A response containing JWT tokens if login is successful.
   * @throws {BadRequestException} If the email or password is invalid.
   */
  async loginAsync(
    loginDto: VendorLoginDto,
  ): Promise<ResponseDto<VendorLoginResponseDto>> {
    const vendor = await this._prismaService.vendor.findFirst({
      where: { email: loginDto.email },
    });

    if (!vendor) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await Hash.verifyAsync(
      loginDto.password,
      vendor.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    // Generate JWT tokens
    const tokens = await this._jwtService.generateTokens({
      id: vendor.id,
      email: vendor.email,
      type: Role.Vendor,
      is_email_verified: vendor.is_email_verified,
      is_number_verified: vendor.is_number_verified,
    });

    return new ResponseDto<VendorLoginResponseDto>(
      true,
      HttpStatus.OK,
      'Login successful',
      tokens,
    );
  }

  /**
   * Refreshes the access token using a valid refresh token
   *
   * @param refreshTokenDto - Contains the refresh token
   * @returns New JWT tokens (access_token and refresh_token)
   * @throws {BadRequestException} If the refresh token is invalid
   */
  async refreshTokenAsync(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<ResponseDto<VendorLoginResponseDto>> {
    const tokens = await this._jwtService.refreshAccessToken(
      refreshTokenDto.refresh_token,
    );

    return new ResponseDto<VendorLoginResponseDto>(
      true,
      HttpStatus.OK,
      'Token refreshed successfully',
      tokens,
    );
  }
  //#endregion
}
