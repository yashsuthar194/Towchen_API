import { Body, Controller, Post } from '@nestjs/common';
import { VendorAuthRequestDto } from './dto/vendor-auth-request.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { VendorAuthService } from './vendor-auth.service';
import { VendorAuthVerificationDto } from './dto/vendor-auth-verification.dto';
import { VendorLoginDto } from './dto/vendor-login.dto';
import { VendorLoginResponseDto } from './dto/vendor-login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordOtpDto } from './dto/forgot-password-otp.dto';
import { ForgotPasswordVerifyDto } from './dto/forgot-password-verify.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';

/**
 * Controller for vendor authentication operations
 * such as OTP-based registration and login.
 */
@Controller('vendor-auth')
export class VendorAuthController {
  constructor(private readonly _vendorAuthService: VendorAuthService) {}

  /**
   * Sends OTP codes to the vendor's phone number and email
   * for registration verification.
   *
   * @param registrationDto - The vendor's phone number and email to send OTPs to.
   * @returns A response indicating whether the OTPs were sent successfully.
   */
  @Post('registration/otp')
  async sendRegistrationOtp(
    @Body() registrationDto: VendorAuthRequestDto,
  ): Promise<ResponseDto<null>> {
    return this._vendorAuthService.sendRegistrationOtpAsync(registrationDto);
  }

  /**
   * Verifies the OTP codes sent to the vendor's phone number and email.
   *
   * @param verificationDto - Contains the vendor's phone number and email, and the OTP codes.
   * @returns A response indicating whether the OTP codes were verified successfully.
   */
  @Post('registration/verify')
  async verifyRegistrationOtpAsync(
    @Body() verificationDto: VendorAuthVerificationDto,
  ): Promise<ResponseDto<null>> {
    return this._vendorAuthService.verifyRegistrationOtpAsync(verificationDto);
  }

  /**
   * Authenticates a vendor and returns JWT tokens
   *
   * @param loginDto - Contains the vendor's email and password
   * @returns A response with access_token and refresh_token
   */
  @Post('login')
  async login(
    @Body() loginDto: VendorLoginDto,
  ): Promise<ResponseDto<VendorLoginResponseDto>> {
    return this._vendorAuthService.loginAsync(loginDto);
  }

  /**
   * Refreshes the access token using a valid refresh token
   *
   * @param refreshTokenDto - Contains the refresh token
   * @returns A response with new access_token and refresh_token
   */
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<ResponseDto<VendorLoginResponseDto>> {
    return this._vendorAuthService.refreshTokenAsync(refreshTokenDto);
  }

  /**
   * Sends a password-reset OTP to the vendor's registered
   * mobile number via SMS.
   * 
   * @param dto - Contains the vendor's registered mobile number.
   * @returns A generic success response.
   */
  @Post('forgot-password/otp')
  async sendForgotPasswordOtp(
    @Body() dto: ForgotPasswordOtpDto,
  ): Promise<ResponseDto<null>> {
    return this._vendorAuthService.sendForgotPasswordOtpAsync(dto);
  }

  /**
   * Verifies the OTP sent to the vendor's mobile number.
   *
   * @param dto - Contains the vendor's mobile number and the 6-digit OTP.
   * @returns A success response confirming the OTP is valid.
   * @throws {BadRequestException} If the OTP is missing, expired, or invalid.
   */
  @Post('forgot-password/verify')
  async verifyForgotPasswordOtp(
    @Body() dto: ForgotPasswordVerifyDto,
  ): Promise<ResponseDto<null>> {
    return this._vendorAuthService.verifyForgotPasswordOtpAsync(dto);
  }

  /**
   * Resets the vendor's password.
   *
   * @param dto - Contains mobile number, OTP, and new password.
   * @returns A success response confirming the password was reset.
   * @throws {BadRequestException} If the OTP is invalid/expired, the
   *   vendor is not found, or the new password matches the old one.
   */
  @Post('forgot-password/reset')
  async resetPassword(
    @Body() dto: ForgotPasswordResetDto,
  ): Promise<ResponseDto<null>> {
    return this._vendorAuthService.resetPasswordAsync(dto);
  }
  //#endregion
}
