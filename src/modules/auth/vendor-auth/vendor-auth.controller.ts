import { Body, Controller, Post } from '@nestjs/common';
import { VendorAuthRequestDto } from './dto/vendor-auth-request.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { VendorAuthService } from './vendor-auth.service';
import { VendorAuthVerificationDto } from './dto/vendor-auth-verification.dto';
import { VendorLoginDto } from './dto/vendor-login.dto';
import { VendorLoginResponseDto } from './dto/vendor-login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

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
}
