import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CashfreeService } from './cashfree.service';
import { VerifyVehicleRcDto } from './dto/verify-vehicle-rc.dto';
import { CashfreeVehicleRcResponseDto } from './dto/cashfree-rc-response.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ICashfreeVehicleRcResponse } from './interfaces/cashfree-rc-response.interface';
import { CallerService } from 'src/services/jwt/caller.service';

@ApiTags('Verification - Vehicle RC')
@ApiExtraModels(VerifyVehicleRcDto, CashfreeVehicleRcResponseDto)
@Controller(['verification', 'cashfree'])
export class CashfreeController {
  constructor(
    private readonly cashfreeService: CashfreeService,
    @Optional() private readonly callerService?: CallerService,
  ) {}

  /**
   * Helper to resolve dealer ID from explicit parameter or authenticated JWT session
   */
  private resolveDealerId(explicitDealerId?: number): number | undefined {
    if (explicitDealerId !== undefined && explicitDealerId !== null) {
      return Number(explicitDealerId);
    }
    if (this.callerService) {
      const caller = this.callerService.getCallerOrNull();
      if (caller && caller.type === Role.Dealer) {
        return caller.id;
      }
    }
    return undefined;
  }

  /**
   * Verify and get Vehicle RC details (POST)
   */
  @Post('vehicle-rc')
  @ApiOperation({
    summary: 'Get Vehicle RC details via Cashfree (POST)',
    description:
      'Fetches vehicle registration, make, model, chassis, engine, fitness, insurance, and ownership details using Cashfree Verification Suite. Each dealer can do a maximum of 25 verifications per day.',
  })
  @ApiResponseDto(CashfreeVehicleRcResponseDto, false, HttpStatus.OK)
  async getVehicleRcDetailsPost(
    @Body() dto: VerifyVehicleRcDto,
  ): Promise<ResponseDto<ICashfreeVehicleRcResponse>> {
    const dealerId = this.resolveDealerId(dto.dealer_id);
    const data = await this.cashfreeService.getVehicleRcDetails(dto, dealerId);
    return ResponseDto.retrieved('Vehicle RC details retrieved successfully', data);
  }

  /**
   * Get current daily API usage and rate limit status for Vehicle RC
   */
  @Get('vehicle-rc/usage')
  @ApiOperation({
    summary: 'Get Vehicle RC daily API usage and quota status',
    description: 'Returns the daily limit (e.g. 25/dealer/day), used requests today for the dealer, remaining requests, and reset time.',
  })
  @ApiQuery({
    name: 'dealer_id',
    required: false,
    description: 'Optional dealer ID. If omitted and authenticated as a dealer, taken from JWT.',
    example: 1,
  })
  async getUsage(
    @Query('dealer_id') queryDealerId?: number,
  ): Promise<ResponseDto<any>> {
    const dealerId = this.resolveDealerId(queryDealerId);
    const usage = await this.cashfreeService.getRcUsage(dealerId);
    return ResponseDto.retrieved('Vehicle RC daily API usage retrieved successfully', usage);
  }

  /**
   * Get Vehicle RC details by vehicle number route parameter (GET)
   */
  @Get('vehicle-rc/:vehicle_number')
  @ApiOperation({
    summary: 'Get Vehicle RC details by vehicle number (GET)',
    description: 'Fetches vehicle registration certificate details using vehicle number as path parameter. Each dealer can do a maximum of 25 verifications per day.',
  })
  @ApiParam({
    name: 'vehicle_number',
    description: 'Vehicle registration number (e.g. PY01MW8769)',
    example: 'PY01MW8769',
  })
  @ApiQuery({
    name: 'verification_id',
    required: false,
    description: 'Optional tracking ID',
    example: 'test001',
  })
  @ApiQuery({
    name: 'dealer_id',
    required: false,
    description: 'Optional dealer ID',
    example: 1,
  })
  @ApiResponseDto(CashfreeVehicleRcResponseDto, false, HttpStatus.OK)
  async getVehicleRcDetailsByParam(
    @Param('vehicle_number') vehicleNumber: string,
    @Query('verification_id') verificationId?: string,
    @Query('dealer_id') queryDealerId?: number,
  ): Promise<ResponseDto<ICashfreeVehicleRcResponse>> {
    const dealerId = this.resolveDealerId(queryDealerId);
    const data = await this.cashfreeService.getVehicleRcDetails(
      {
        vehicle_number: vehicleNumber,
        verification_id: verificationId,
        dealer_id: dealerId,
      },
      dealerId,
    );
    return ResponseDto.retrieved('Vehicle RC details retrieved successfully', data);
  }

  /**
   * Get Vehicle RC details via query parameter (GET)
   */
  @Get('vehicle-rc')
  @ApiOperation({
    summary: 'Get Vehicle RC details via query parameter (GET)',
    description: 'Fetches vehicle registration certificate details using query parameters. Each dealer can do a maximum of 25 verifications per day.',
  })
  @ApiQuery({
    name: 'vehicle_number',
    required: true,
    description: 'Vehicle registration number (e.g. PY01MW8769)',
    example: 'PY01MW8769',
  })
  @ApiQuery({
    name: 'verification_id',
    required: false,
    description: 'Optional tracking ID',
    example: 'test001',
  })
  @ApiQuery({
    name: 'dealer_id',
    required: false,
    description: 'Optional dealer ID',
    example: 1,
  })
  @ApiResponseDto(CashfreeVehicleRcResponseDto, false, HttpStatus.OK)
  async getVehicleRcDetailsByQuery(
    @Query('vehicle_number') vehicleNumber: string,
    @Query('verification_id') verificationId?: string,
    @Query('dealer_id') queryDealerId?: number,
  ): Promise<ResponseDto<ICashfreeVehicleRcResponse>> {
    const dealerId = this.resolveDealerId(queryDealerId);
    const data = await this.cashfreeService.getVehicleRcDetails(
      {
        vehicle_number: vehicleNumber,
        verification_id: verificationId,
        dealer_id: dealerId,
      },
      dealerId,
    );
    return ResponseDto.retrieved('Vehicle RC details retrieved successfully', data);
  }
}
