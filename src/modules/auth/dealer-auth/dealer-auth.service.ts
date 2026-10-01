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

const dealerAuthSelect = {
  id: true,
  formated_id: true,
  name: true,
  number: true,
  alternative_number: true,
  email: true,
  residential_address: true,
  bank_name: true,
  ifsc_code: true,
  account_number: true,
  account_holder_name: true,
  dealer_image: true,
  aadhar_image: true,
  pan_image: true,
  bankdetails_image: true,
  created_at: true,
  updated_at: true,
} as const;

@Injectable()
export class DealerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private mapToProfileDto(dealer: {
    id: number;
    formated_id: string;
    name: string;
    number: string;
    alternative_number: string | null;
    email: string;
    residential_address: string | null;
    bank_name: string | null;
    ifsc_code: string;
    account_number: string;
    account_holder_name: string;
    dealer_image: string | null;
    aadhar_image: string;
    pan_image: string;
    bankdetails_image: string | null;
    created_at: Date;
    updated_at: Date;
  }): DealerProfileDto {
    return {
      id: dealer.id,
      formated_id: dealer.formated_id,
      name: dealer.name,
      number: dealer.number,
      alternative_number: dealer.alternative_number,
      email: dealer.email,
      role: Role.Dealer,
      residential_address: dealer.residential_address,
      bank_name: dealer.bank_name,
      ifsc_code: dealer.ifsc_code,
      account_number: dealer.account_number,
      account_holder_name: dealer.account_holder_name,
      dealer_image: dealer.dealer_image,
      aadhar_image: dealer.aadhar_image,
      pan_image: dealer.pan_image,
      bankdetails_image: dealer.bankdetails_image,
      created_at: dealer.created_at,
      updated_at: dealer.updated_at,
    };
  }

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
        formated_id: '',
        name: dto.name,
        number: dto.number,
        alternative_number: dto.alternative_number ?? null,
        email: dto.email,
        password: hashedPassword,
        residential_address: dto.residential_address ?? null,
        bank_name: dto.bank_name ?? null,
        ifsc_code: dto.ifsc_code,
        account_number: dto.account_number,
        account_holder_name: dto.account_holder_name,
        dealer_image: dto.dealer_image ?? null,
        aadhar_image: dto.aadhar_image,
        pan_image: dto.pan_image,
        bankdetails_image: dto.bankdetails_image ?? null,
      },
      select: dealerAuthSelect,
    });

    const tokens = await this.jwtService.generateTokens({
      id: newDealer.id,
      email: newDealer.email,
      type: Role.Dealer,
    });

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      dealer: this.mapToProfileDto(newDealer),
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
      select: {
        ...dealerAuthSelect,
        password: true,
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
      dealer: this.mapToProfileDto(dealer),
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
      select: dealerAuthSelect,
    });

    if (!dealer) {
      throw new UnauthorizedException('Dealer account not found or has been disabled.');
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      dealer: this.mapToProfileDto(dealer),
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
      select: dealerAuthSelect,
    });

    if (!dealer) {
      throw new NotFoundException('Dealer profile not found.');
    }

    return this.mapToProfileDto(dealer);
  }
}
