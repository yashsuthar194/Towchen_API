import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CashfreeService } from './cashfree.service';
import { VerifyVehicleRcDto } from './dto/verify-vehicle-rc.dto';
import { CashfreeVehicleRcResponseDto } from './dto/cashfree-rc-response.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ICashfreeVehicleRcResponse } from './interfaces/cashfree-rc-response.interface';

@ApiTags('Verification - Vehicle RC')
@ApiExtraModels(VerifyVehicleRcDto, CashfreeVehicleRcResponseDto)
@Controller(['verification', 'cashfree'])
export class CashfreeController {
  constructor(private readonly cashfreeService: CashfreeService) {}

  /**
   * Verify and get Vehicle RC details (POST)
   */
  @Post('vehicle-rc')
  @ApiOperation({
    summary: 'Get Vehicle RC details via Cashfree (POST)',
    description:
      'Fetches vehicle registration, make, model, chassis, engine, fitness, insurance, and ownership details using Cashfree Verification Suite.',
  })
  @ApiResponseDto(CashfreeVehicleRcResponseDto, false, HttpStatus.OK)
  async getVehicleRcDetailsPost(
    @Body() dto: VerifyVehicleRcDto,
  ): Promise<ResponseDto<ICashfreeVehicleRcResponse>> {
    const data = await this.cashfreeService.getVehicleRcDetails(dto);
    return ResponseDto.retrieved('Vehicle RC details retrieved successfully', data);
  }

  /**
   * Get current daily API usage and rate limit status for Vehicle RC
   */
  @Get('vehicle-rc/usage')
  @ApiOperation({
    summary: 'Get Vehicle RC daily API usage and quota status',
    description: 'Returns the daily limit (e.g. 25/day), used requests today, remaining requests, and reset time.',
  })
  async getUsage(): Promise<ResponseDto<any>> {
    const usage = await this.cashfreeService.getRcUsage();
    return ResponseDto.retrieved('Vehicle RC daily API usage retrieved successfully', usage);
  }

  /**
   * Get Vehicle RC details by vehicle number route parameter (GET)
   */
  @Get('vehicle-rc/:vehicle_number')
  @ApiOperation({
    summary: 'Get Vehicle RC details by vehicle number (GET)',
    description: 'Fetches vehicle registration certificate details using vehicle number as path parameter.',
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
  @ApiResponseDto(CashfreeVehicleRcResponseDto, false, HttpStatus.OK)
  async getVehicleRcDetailsByParam(
    @Param('vehicle_number') vehicleNumber: string,
    @Query('verification_id') verificationId?: string,
  ): Promise<ResponseDto<ICashfreeVehicleRcResponse>> {
    const data = await this.cashfreeService.getVehicleRcDetails({
      vehicle_number: vehicleNumber,
      verification_id: verificationId,
    });
    return ResponseDto.retrieved('Vehicle RC details retrieved successfully', data);
  }

  /**
   * Get Vehicle RC details via query parameter (GET)
   */
  @Get('vehicle-rc')
  @ApiOperation({
    summary: 'Get Vehicle RC details via query parameter (GET)',
    description: 'Fetches vehicle registration certificate details using query parameters.',
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
  @ApiResponseDto(CashfreeVehicleRcResponseDto, false, HttpStatus.OK)
  async getVehicleRcDetailsByQuery(
    @Query('vehicle_number') vehicleNumber: string,
    @Query('verification_id') verificationId?: string,
  ): Promise<ResponseDto<ICashfreeVehicleRcResponse>> {
    const data = await this.cashfreeService.getVehicleRcDetails({
      vehicle_number: vehicleNumber,
      verification_id: verificationId,
    });
    return ResponseDto.retrieved('Vehicle RC details retrieved successfully', data);
  }
}

