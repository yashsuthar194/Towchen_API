import { Body, Controller, Post, HttpStatus } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { AdminLoginResponseDto } from './dto/admin-login-response.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RefreshTokenDto } from './dto/refresh-token.dto';
@ApiTags('Admin Auth')
@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly _adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login using email and password' })
  @ApiResponse({ status: 200, type: AdminLoginResponseDto })
  async loginAsync(@Body() loginDto: AdminLoginDto): Promise<ResponseDto<AdminLoginResponseDto>> {
    const data = await this._adminAuthService.loginAsync(loginDto);
    return new ResponseDto(true, HttpStatus.OK, 'Login successful', data);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh admin access token using refresh token' })
  @ApiResponse({ status: 200, type: AdminLoginResponseDto })
  async refreshTokenAsync(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<ResponseDto<AdminLoginResponseDto>> {
    return this._adminAuthService.refreshTokenAsync(refreshTokenDto);
  }
}
