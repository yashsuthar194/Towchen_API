import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { DriverLoginDto } from './dto/driver-login.dto';
import { DriverAuthService } from './driver-auth.service';
import { DriverLoginResponseDto } from './dto/driver-login-response.dto';
import { DriverVerificationRequestDto } from './dto/driver-verification-request.dto';
import { DriverVerificationDto } from './dto/driver-verification.dto';
import { DriverOtpLoginDto } from './dto/driver-otp-login.dto';
import { DriverOtpVerificationDto } from './dto/driver-otp-verification.dto';
import { DriverChangePasswordDto } from './dto/driver-change-password.dto';
import { DriverForgotPasswordOtpDto } from './dto/driver-forgot-password-otp.dto';
import { DriverResetPasswordDto } from './dto/driver-reset-password.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponseDto, ApiResponseDtoNull } from 'src/core/response/decorators/api-response-dto.decorator';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CallerService } from 'src/services/jwt/caller.service';


@ApiTags('Driver Auth')
@Controller('driver-auth')
export class DriverAuthController {
  constructor(
    private readonly _driverAuthService: DriverAuthService,
    private readonly _callerService: CallerService,
  ) { }

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

  /**
   * Request a login OTP for a driver.
   * @param request The request containing the driver's mobile number.
   */
  @Post('login/otp')
  @ApiOperation({ summary: 'Request a login OTP for a driver' })
  @ApiBody({ type: DriverOtpLoginDto })
  @ApiResponseDtoNull(201)
  async sendLoginOtpAsync(
    @Body() request: DriverOtpLoginDto,
  ): Promise<ResponseDto<null>> {
    return this._driverAuthService.sendLoginOtpAsync(request);
  }

  /**
   * Verifies the login OTP and returns JWT tokens.
   * @param request The request containing the number and OTP.
   */
  @Post('login/otp/verify')
  @ApiOperation({ summary: 'Verify login OTP and get JWT tokens' })
  @ApiBody({ type: DriverOtpVerificationDto })
  @ApiResponseDto(DriverLoginResponseDto)
  async verifyLoginOtpAsync(
    @Body() request: DriverOtpVerificationDto,
  ): Promise<ResponseDto<DriverLoginResponseDto>> {
    return this._driverAuthService.verifyLoginOtpAsync(request);
  }

  /**
   * Change password for an authenticated driver.
   */
  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password for an authenticated driver' })
  @ApiBody({ type: DriverChangePasswordDto })
  @ApiResponseDtoNull()
  async changePasswordAsync(
    @Body() dto: DriverChangePasswordDto,
  ): Promise<ResponseDto<any>> {
    const driverId = this._callerService.getUserId();
    return await this._driverAuthService.changePasswordAsync(driverId, dto);
  }

  /**
   * Request a forgot password OTP.
   */
  @Post('forgot-password/otp')
  @ApiOperation({ summary: 'Request an OTP for forgot password' })
  @ApiBody({ type: DriverForgotPasswordOtpDto })
  @ApiResponseDtoNull()
  async sendForgotPasswordOtpAsync(
    @Body() dto: DriverForgotPasswordOtpDto,
  ): Promise<ResponseDto<any>> {
    return await this._driverAuthService.sendForgotPasswordOtpAsync(dto);
  }

  /**
   * Reset password using OTP.
   */
  @Post('forgot-password/reset')
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiBody({ type: DriverResetPasswordDto })
  @ApiResponseDtoNull()
  async resetPasswordAsync(
    @Body() dto: DriverResetPasswordDto,
  ): Promise<ResponseDto<any>> {
    return await this._driverAuthService.resetPasswordAsync(dto);
  }
}
