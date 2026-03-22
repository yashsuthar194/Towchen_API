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
import { ForgotPasswordOtpDto } from './dto/forgot-password-otp.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';

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

  //#region Forgot Password
  /**
   * Sends a password-reset OTP to the vendor's registered mobile number.
   *
   * Edge cases handled:
   * - Throws if no active vendor is found with the given number (do not reveal
   *   whether the number exists in the system to prevent enumeration).
   *
   * @param dto - Contains the vendor's registered mobile number.
   * @returns A generic success response (same message regardless of whether
   *          the number is found, to prevent user enumeration).
   */
  async sendForgotPasswordOtpAsync(
    dto: ForgotPasswordOtpDto,
  ): Promise<ResponseDto<null>> {
    // Check vendor exists with this number (but respond generically either way
    // to prevent mobile-number enumeration attacks).
    const vendor = await this._prismaService.vendor.findFirst({
      where: { email: dto.email, is_deleted: false }
    });

    if (!vendor) {
      // Return the same success-looking response to avoid enumeration
      return new ResponseDto<null>(
        true,
        HttpStatus.OK,
        'If this number is registered, an OTP has been sent',
        null,
      );
    }

    const otp = Utility.generateOtp(OTP_LENGTH);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this._prismaService.otp.create({
      data: {
        otp: otp.toString(),
        email: dto.email,
        type: OtpType.Email,
        expires_at: expiresAt,
      },
    });

    const template = TemplateHelper.replaceVariables(
      TemplateHelper.getTemplate('otp'),
      {
        APP_NAME: 'Towchen Service',
        OTP: otp,
        EXPIRY_MINUTES: OTP_EXPIRY_MINUTES,
        SUPPORT_EMAIL: 'support@towchen.com',
      },
    );

    const emailResponse = await this._emailService.sendMailAsync({
      to: dto.email,
      subject: 'Password reset OTP',
      text: `Your Towchen password reset OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
      html: template,
    });

    if (!emailResponse?.success) {
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }

    return new ResponseDto<null>(
      true,
      HttpStatus.OK,
      'If this email is registered, an OTP has been sent',
      null,
    );
  }

  /**
   * Verifies the forgot-password OTP for a given mobile number.
   *
   * Edge cases handled:
   * - OTP not found → 400
   * - OTP expired → 400
   * - OTP mismatch → 400
   *
   * @param dto - Contains the vendor's mobile number and the 6-digit OTP.
   * @returns A response indicating successful verification.
   */
  async verifyForgotPasswordOtpAsync(
    dto: ForgotPasswordVerifyDto,
  ): Promise<ResponseDto<null>> {
    const otpRecord = await this._prismaService.otp.findFirst({
      where: { email: dto.email, type: OtpType.Email },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found for this email. Please request a new one.');
    }

    if (otpRecord.expires_at < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (otpRecord.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    return new ResponseDto<null>(
      true,
      HttpStatus.OK,
      'OTP verified successfully. You may now reset your password.',
      null,
    );
  }

  /**
   * Resets the vendor's password after re-verifying the OTP.
   *
   * The OTP is verified again here (stateless flow) so that a vendor
   * cannot skip the verify step and call reset directly.
   *
   * Edge cases handled:
   * - No vendor found with number → 400
   * - OTP not found / expired / mismatched → 400
   * - New password same as old password → 400
   *
   * @param dto - Contains the mobile number, OTP, and new password.
   * @returns A response confirming the password was reset.
   */
  async resetPasswordAsync(
    dto: ForgotPasswordResetDto,
  ): Promise<ResponseDto<null>> {
    // Verify OTP once more (stateless – avoids skipping the verify step)
    const otpRecord = await this._prismaService.otp.findFirst({
      where: { email: dto.email, type: OtpType.Email },
      orderBy: { created_at: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found for this email. Please request a new one.');
    }

    if (otpRecord.expires_at < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (otpRecord.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP. Please check and try again.');
    }

    // Confirm vendor with this email exists and is active
    const vendor = await this._prismaService.vendor.findFirst({
      where: { email: dto.email, is_deleted: false },
      select: { id: true, password: true },
    });

    if (!vendor) {
      throw new BadRequestException('No active vendor found with this email.');
    }

    // Prevent setting the same password
    const isSamePassword = await Hash.verifyAsync(dto.new_password, vendor.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from the current password.',
      );
    }

    const hashedPassword = await Hash.hashAsync(dto.new_password);

    await this._prismaService.vendor.update({
      where: { id: vendor.id },
      data: { password: hashedPassword },
    });

    return new ResponseDto<null>(
      true,
      HttpStatus.OK,
      'Password reset successfully. Please log in with your new password.',
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
      where: { formated_id: loginDto.formated_id },
    });

    if (!vendor) {
      throw new BadRequestException('Invalid ID or password');
    }

    if (vendor.status !== 'Approved') {
      throw new BadRequestException('Vendor is not approved');
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
