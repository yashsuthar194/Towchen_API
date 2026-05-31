import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { CalculateVoucherRequestDto } from './dto/calculate-voucher.dto';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CallerService } from 'src/services/jwt/caller.service';

@ApiTags('Voucher')
@Controller('voucher')
export class VoucherController {
    constructor(
        private readonly _voucherService: VoucherService,
        private readonly _callerService: CallerService
    ) {}

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Post('generate')
    @ApiOperation({ summary: 'Generate a new referral voucher for the authenticated customer' })
    async generateVoucher() {
        const userId = this._callerService.getUserId();
        const result = await this._voucherService.generateVoucherAsync(userId);
        return ResponseDto.created('Voucher code generated successfully', result);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Post('validate')
    @ApiOperation({ summary: 'Validate a voucher code and return discount details' })
    @ApiBody({ type: ValidateVoucherDto })
    async validateVoucher(@Body() dto: ValidateVoucherDto) {
        const userId = this._callerService.getUserId();
        const result = await this._voucherService.validateVoucherAsync(dto.code, userId);
        return ResponseDto.retrieved('Voucher is valid', {
            code: result.code,
            discount_percent: result.discount_percent
        });
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('my-vouchers')
    @ApiOperation({ summary: 'List all vouchers created by the authenticated customer' })
    async getMyVouchers() {
        const userId = this._callerService.getUserId();
        const result = await this._voucherService.getUserVouchersAsync(userId);
        return ResponseDto.retrieved('Your vouchers retrieved successfully', result);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Post('calculate')
    @ApiOperation({ summary: 'Calculate final price and taxes when a voucher is applied' })
    @ApiBody({ type: CalculateVoucherRequestDto })
    async calculateDiscount(@Body() dto: CalculateVoucherRequestDto) {
        const userId = this._callerService.getUserId();
        const result = await this._voucherService.calculateDiscountAsync(dto, userId);
        return ResponseDto.retrieved('Discount calculated successfully', result);
    }
}
