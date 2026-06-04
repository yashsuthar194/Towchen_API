import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletDetailDto } from './dto/wallet-detail.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CustomerGuard } from 'src/services/jwt/guards/customer.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { WalletUpdateDto } from './dto/wallet-update.dto';
import { CallerService } from 'src/services/jwt/caller.service';
@Controller('wallet')
export class WalletController {
  constructor(private readonly _walletService: WalletService, private readonly _callerService: CallerService) {}

  /**
   * @description get user wallet
   * @returns WalletDetailDto
   */
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponseDto(WalletDetailDto)
  @Get('/me')
  async getUserWallet(): Promise<ResponseDto<WalletDetailDto>> {
    const userId = this._callerService.getUserId();
    const wallet = await this._walletService.getUserWallet(userId);
    return ResponseDto.retrieved('Wallet retrieved successfully', wallet);
  }

  /**
   * @description update user wallet
   * @param dto WalletUpdateDto
   * @returns WalletDetailDto
   */
  @Put('')
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponseDto(WalletDetailDto)
  async updateWallet(@Body() dto: WalletUpdateDto) {
    const userId = dto.user_id ?? this._callerService.getUserId();
    const wallet = await this._walletService.updateWallet(userId, dto.amount, dto.transaction_type);

    return ResponseDto.updated('Wallet updated successfully', wallet);
  }
}
