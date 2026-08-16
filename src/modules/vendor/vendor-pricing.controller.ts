import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';
import { AdminGuard } from 'src/services/jwt/guards/admin.guard';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { VendorPricingService } from './vendor-pricing.service';
import { UpdateVendorPricingDto } from './dto/update-vendor-pricing.dto';
import { VendorPricingDto, VendorPricingWithCeilingDto } from './dto/vendor-pricing.dto';

@ApiTags('Vendor Pricing')
@ApiBearerAuth('JWT-auth')
@Controller('vendor')
export class VendorPricingController {
  constructor(private readonly vendorPricingService: VendorPricingService) {}

  @Get('pricing')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiOperation({
    summary: 'Get your current pricing configuration',
    description: 'Returns all your pricing rows enriched with your location\'s ceiling values.',
  })
  @ApiResponseDto(VendorPricingWithCeilingDto, true)
  async getMyPricing(): Promise<ResponseDto<VendorPricingWithCeilingDto[]>> {
    const pricings = await this.vendorPricingService.getMyPricingAsync();
    return ResponseDto.retrieved('Pricing configuration retrieved', pricings);
  }

  @Put('pricing/:subServiceId')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiOperation({
    summary: 'Update your pricing for a specific sub-service',
    description: 'Enforces that your new prices do not exceed the location\'s configured ceiling.',
  })
  @ApiResponseDto(VendorPricingDto)
  async updateMyPricing(
    @Param('subServiceId', ParseIntPipe) subServiceId: number,
    @Body() dto: UpdateVendorPricingDto,
  ): Promise<ResponseDto<VendorPricingDto>> {
    const updated = await this.vendorPricingService.updateMyPricingAsync(
      subServiceId,
      dto,
    );
    return ResponseDto.updated('Pricing updated successfully', updated);
  }

  @Get(':id/pricing')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({
    summary: 'Admin: Get pricing configuration for a specific vendor',
  })
  @ApiResponseDto(VendorPricingDto, true)
  async getPricingForVendor(
    @Param('id', ParseIntPipe) vendorId: number,
  ): Promise<ResponseDto<VendorPricingDto[]>> {
    const pricings = await this.vendorPricingService.getPricingForVendorAsync(
      vendorId,
    );
    return ResponseDto.retrieved('Vendor pricing retrieved', pricings);
  }
}
