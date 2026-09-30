import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { DealerAuthService } from './dealer-auth.service';
import { DealerLoginDto } from './dto/dealer-login.dto';
import { DealerRegisterDto } from './dto/dealer-register.dto';
import { DealerRefreshTokenDto } from './dto/dealer-refresh-token.dto';
import {
  DealerLoginResponseDto,
  DealerProfileDto,
} from './dto/dealer-login-response.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { DealerGuard } from 'src/services/jwt/guards/dealer.guard';
import { CallerService } from 'src/services/jwt/caller.service';

@ApiTags('Dealer Auth')
@Controller('dealer-auth')
export class DealerAuthController {
  constructor(
    private readonly dealerAuthService: DealerAuthService,
    private readonly callerService: CallerService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new dealer account' })
  @ApiBody({ type: DealerRegisterDto })
  @ApiResponseDto(DealerLoginResponseDto, false, HttpStatus.CREATED)
  async registerAsync(
    @Body() registerDto: DealerRegisterDto,
  ): Promise<ResponseDto<DealerLoginResponseDto>> {
    const data = await this.dealerAuthService.registerAsync(registerDto);
    return ResponseDto.created('Dealer registered successfully', data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Dealer login using email and password' })
  @ApiBody({ type: DealerLoginDto })
  @ApiResponseDto(DealerLoginResponseDto, false, HttpStatus.OK)
  async loginAsync(
    @Body() loginDto: DealerLoginDto,
  ): Promise<ResponseDto<DealerLoginResponseDto>> {
    const data = await this.dealerAuthService.loginAsync(loginDto);
    return ResponseDto.success('Dealer login successful', data);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh dealer JWT tokens' })
  @ApiBody({ type: DealerRefreshTokenDto })
  @ApiResponseDto(DealerLoginResponseDto, false, HttpStatus.OK)
  async refreshTokenAsync(
    @Body() refreshTokenDto: DealerRefreshTokenDto,
  ): Promise<ResponseDto<DealerLoginResponseDto>> {
    const data = await this.dealerAuthService.refreshTokenAsync(refreshTokenDto);
    return ResponseDto.success('Token refreshed successfully', data);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, DealerGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current authenticated dealer profile' })
  @ApiResponseDto(DealerProfileDto, false, HttpStatus.OK)
  async getProfileAsync(): Promise<ResponseDto<DealerProfileDto>> {
    const dealerId = this.callerService.getUserId();
    const data = await this.dealerAuthService.getProfileAsync(dealerId);
    return ResponseDto.retrieved('Dealer profile retrieved successfully', data);
  }
}
