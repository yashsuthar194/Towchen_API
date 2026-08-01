import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLoginResponseDto } from './dto/admin-login-response.dto';
import { JwtService } from 'src/services/jwt/jwt.service';
import { Hash } from 'src/shared/helper/hash';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
@Injectable()
export class AdminAuthService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _jwtService: JwtService,
  ) {}

  /**
   * Logs in an admin and returns an access token
   *
   * @param loginDto - Contains the admin's email and password
   * @returns An object containing the access token and basic admin info
   * @throws {NotFoundException} If the admin doesn't exist or is deleted
   * @throws {UnauthorizedException} If the password is incorrect
   */
  async loginAsync(loginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const admin = await this._prismaService.admin.findUnique({
      where: { email: loginDto.email },
    });

    if (!admin || admin.is_deleted) {
      throw new NotFoundException('Admin account not found or has been disabled');
    }

    const isPasswordValid = await Hash.verifyAsync(loginDto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { access_token, refresh_token } = await this._jwtService.generateTokens({
      id: admin.id,
      email: admin.email,
      type: admin.role,
    });

    return {
      access_token: access_token,
      refresh_token: refresh_token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  /**
   * Refreshes the access token using a valid refresh token
   *
   * @param refreshTokenDto - Contains the refresh token
   * @returns New JWT tokens
   */
  async refreshTokenAsync(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<ResponseDto<AdminLoginResponseDto>> {
    const tokens = await this._jwtService.refreshAccessToken(
      refreshTokenDto.refresh_token,
    );

    // To construct AdminLoginResponseDto we also need the admin details.
    // The tokens object has access_token and refresh_token, we should return that.
    // Let's decode or use verify to get admin ID and fetch admin details to match the login response.
    const payload = await this._jwtService.verifyToken(tokens.access_token);
    
    const admin = await this._prismaService.admin.findUnique({
      where: { id: payload.id as number },
    });

    if (!admin || admin.is_deleted) {
      throw new UnauthorizedException('Admin account not found or has been disabled');
    }

    return new ResponseDto(true, 200, 'Token refreshed successfully', {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  }
}
