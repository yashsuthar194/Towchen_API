import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { JwtService } from 'src/services/jwt/jwt.service';
import { Hash } from 'src/shared/helper/hash';
import { Role } from '@prisma/client';
import { DealerLoginDto } from './dto/dealer-login.dto';
import { DealerRegisterDto } from './dto/dealer-register.dto';
import { DealerRefreshTokenDto } from './dto/dealer-refresh-token.dto';
import { DealerLoginResponseDto, DealerProfileDto } from './dto/dealer-login-response.dto';

@Injectable()
export class DealerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new dealer and returns JWT tokens with profile
   */
  async registerAsync(dto: DealerRegisterDto): Promise<DealerLoginResponseDto> {
    const existing = await this.prisma.dealer.findFirst({
      where: {
        email: dto.email,
        is_deleted: false,
      },
    });

    if (existing) {
      throw new ConflictException('A dealer with this email already exists.');
    }

    const hashedPassword = await Hash.hashAsync(dto.password);

    const newDealer = await this.prisma.dealer.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        formated_id: '',
      },
      select: {
        id: true,
        formated_id: true,
        email: true,
        created_at: true,
        updated_at: true,
      },
    });

    const tokens = await this.jwtService.generateTokens({
      id: newDealer.id,
      email: newDealer.email,
      type: Role.Dealer,
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      dealer: {
        id: newDealer.id,
        formated_id: newDealer.formated_id,
        email: newDealer.email,
        role: Role.Dealer,
        created_at: newDealer.created_at,
        updated_at: newDealer.updated_at,
      },
    };
  }

  /**
   * Authenticates a dealer using email and password
   */
  async loginAsync(dto: DealerLoginDto): Promise<DealerLoginResponseDto> {
    const dealer = await this.prisma.dealer.findFirst({
      where: {
        email: dto.email,
        is_deleted: false,
      },
    });

    if (!dealer) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await Hash.verifyAsync(dto.password, dealer.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this.jwtService.generateTokens({
      id: dealer.id,
      email: dealer.email,
      type: Role.Dealer,
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      dealer: {
        id: dealer.id,
        formated_id: dealer.formated_id,
        email: dealer.email,
        role: Role.Dealer,
        created_at: dealer.created_at,
        updated_at: dealer.updated_at,
      },
    };
  }

  /**
   * Refreshes JWT tokens using a valid refresh token
   */
  async refreshTokenAsync(dto: DealerRefreshTokenDto): Promise<DealerLoginResponseDto> {
    const tokens = await this.jwtService.refreshAccessToken(dto.refresh_token);
    const payload = await this.jwtService.verifyToken(tokens.access_token);

    const dealer = await this.prisma.dealer.findFirst({
      where: {
        id: payload.id as number,
        is_deleted: false,
      },
    });

    if (!dealer) {
      throw new UnauthorizedException('Dealer account not found or has been disabled.');
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      dealer: {
        id: dealer.id,
        formated_id: dealer.formated_id,
        email: dealer.email,
        role: Role.Dealer,
        created_at: dealer.created_at,
        updated_at: dealer.updated_at,
      },
    };
  }

  /**
   * Retrieves profile for the current authenticated dealer
   */
  async getProfileAsync(dealerId: number): Promise<DealerProfileDto> {
    const dealer = await this.prisma.dealer.findFirst({
      where: {
        id: dealerId,
        is_deleted: false,
      },
      select: {
        id: true,
        formated_id: true,
        email: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!dealer) {
      throw new NotFoundException('Dealer profile not found.');
    }

    return {
      id: dealer.id,
      formated_id: dealer.formated_id,
      email: dealer.email,
      role: Role.Dealer,
      created_at: dealer.created_at,
      updated_at: dealer.updated_at,
    };
  }
}
