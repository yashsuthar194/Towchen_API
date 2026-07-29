import { Body, Controller, Post, UseGuards, HttpStatus } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { AdminLoginResponseDto } from './dto/admin-login-response.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { SuperAdminGuard } from 'src/services/jwt/guards/super-admin.guard';
import { CreateAdminDto } from './dto/create-admin.dto';

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

  @Post('create')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Admin (SuperAdmin only)' })
  @ApiResponse({ status: 201, description: 'Admin created successfully' })
  async createAdminAsync(@Body() createAdminDto: CreateAdminDto) {
    const data = await this._adminAuthService.createAdminAsync(createAdminDto);
    return new ResponseDto(true, HttpStatus.CREATED, 'Admin created successfully', data);
  }
}
