import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminLoginResponseDto } from './dto/admin-login-response.dto';
import { JwtService } from 'src/services/jwt/jwt.service';
import { Hash } from 'src/shared/helper/hash';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Role } from '@prisma/client';

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
      accessToken: access_token,
      refreshToken: refresh_token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  /**
   * Creates a new Admin account.
   *
   * @param createDto - Contains the new admin's details
   * @returns Basic admin info of the created account
   * @throws {BadRequestException} If the email is already in use
   */
  async createAdminAsync(createDto: CreateAdminDto) {
    const existingAdmin = await this._prismaService.admin.findUnique({
      where: { email: createDto.email },
    });

    if (existingAdmin) {
      throw new BadRequestException('An admin with this email already exists');
    }

    const hashedPassword = await Hash.hashAsync(createDto.password);

    const newAdmin = await this._prismaService.admin.create({
      data: {
        email: createDto.email,
        name: createDto.name,
        password: hashedPassword,
        role: Role.Admin, // Only standard Admin creation allowed via API
      },
    });

    return {
      id: newAdmin.id,
      email: newAdmin.email,
      name: newAdmin.name,
      role: newAdmin.role,
    };
  }
}
