import { Body, Controller, Post } from '@nestjs/common';
import { DriverLoginDto } from './dto/driver-login.dto';
import { DriverAuthService } from './driver-auth.service';
import { DriverLoginResponseDto } from './dto/driver-login-response.dto';
import { DriverVerificationRequestDto } from './dto/driver-verification-request.dto';
import { DriverVerificationDto } from './dto/driver-verification.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';

@Controller('driver-auth')
export class DriverAuthController {
  constructor(private readonly _driverAuthService: DriverAuthService) {}

  /**
   * Login a driver.
   * @param request The login request containing email and password.
   * @returns The login response containing access and refresh tokens, and verification statuses.
   */
  @Post('login')
  async loginAsync(
    @Body() request: DriverLoginDto,
  ): Promise<DriverLoginResponseDto> {
    return this._driverAuthService.loginAsync(request);
  }

  /**
   * Send verification OTPs to the driver's email and mobile number.
   * @param request The request containing the driver's email and mobile number.
   * @returns A response indicating the success or failure of the OTP sending process.
   */
  @Post('verification/otp')
  async sendVerificationOtpAsync(
    @Body() request: DriverVerificationRequestDto,
  ): Promise<ResponseDto<null>> {
    return this._driverAuthService.sendVerificationOtpAsync(request);
  }

  /**
   * Verifies the OTPs for the driver's email and mobile number.
   * @param request The request containing the driver's email, mobile number, and OTPs.
   * @returns A response indicating the success or failure of the OTP verification process.
   */
  @Post('verification/otp/verify')
  async verifyVerificationOtpAsync(
    @Body() request: DriverVerificationDto,
  ): Promise<ResponseDto<null>> {
    return this._driverAuthService.verifyVerificationOtpAsync(request);
  }
}
