import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { AdminGuard } from 'src/services/jwt/guards/admin.guard';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import {
  ApiResponseDto,
  ApiResponseDtoNull,
} from 'src/core/response/decorators/api-response-dto.decorator';
import { ServiceLocationService } from './service-location.service';
import { CreateServiceLocationDto } from './dto/create-service-location.dto';
import { UpsertLocationPricingDto } from './dto/upsert-location-pricing.dto';
import { ServiceLocationDto } from './dto/service-location.dto';

@ApiTags('Service Location')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard) // All endpoints are admin-only
@Controller('service-location')
export class ServiceLocationController {
  constructor(
    private readonly _serviceLocationService: ServiceLocationService,
  ) {}

  // ─── Location CRUD ───────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all ServiceArea locations (shown to vendors during registration)' })
  @ApiResponseDto(ServiceLocationDto, true)
  async findAll(): Promise<ResponseDto<ServiceLocationDto[]>> {
    const locations = await this._serviceLocationService.findAllAsync();
    return ResponseDto.retrieved('Service locations retrieved', locations);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single ServiceArea location with its pricing ceilings' })
  @ApiResponseDto(ServiceLocationDto)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<ServiceLocationDto>> {
    const location = await this._serviceLocationService.findOneAsync(id);
    return ResponseDto.retrieved('Service location retrieved', location);
  }

  @Post()
  @ApiOperation({
    summary: 'Admin creates a ServiceArea location from a Google Place ID',
    description: 'The backend resolves lat/lng and address from Google Maps automatically.',
  })
  @ApiResponseDto(ServiceLocationDto, false, 201)
  async create(
    @Body() dto: CreateServiceLocationDto,
  ): Promise<ResponseDto<ServiceLocationDto>> {
    const location = await this._serviceLocationService.createAsync(dto);
    return ResponseDto.created('Service location created', location);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update the name of a ServiceArea location' })
  @ApiResponseDto(ServiceLocationDto)
  async updateName(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
  ): Promise<ResponseDto<ServiceLocationDto>> {
    const location = await this._serviceLocationService.updateNameAsync(
      id,
      name,
    );
    return ResponseDto.updated('Service location updated', location);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a ServiceArea location from the active list' })
  @ApiResponseDtoNull()
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<null>> {
    await this._serviceLocationService.deleteAsync(id);
    return ResponseDto.deleted('Service location removed');
  }

  // ─── Pricing Ceiling CRUD ────────────────────────────────────────────────────

  @Get(':id/pricing')
  @ApiOperation({ summary: 'Get all sub-service price ceilings for a location' })
  @ApiResponseDto(ServiceLocationDto)
  async getPricings(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<ServiceLocationDto>> {
    const location = await this._serviceLocationService.getPricingsAsync(id);
    return ResponseDto.retrieved('Location pricings retrieved', location);
  }

  @Post(':id/pricing')
  @ApiOperation({
    summary: 'Set or update the price ceiling for a sub-service in a location',
    description:
      'Vendors linked to this location cannot set prices above these values.',
  })
  @ApiResponseDtoNull()
  async upsertPricing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertLocationPricingDto,
  ): Promise<ResponseDto<null>> {
    await this._serviceLocationService.upsertPricingAsync(id, dto);
    return ResponseDto.updated('Pricing ceiling saved', null);
  }

  @Delete(':id/pricing/:subServiceId')
  @ApiOperation({ summary: 'Remove the price ceiling for a specific sub-service in a location' })
  @ApiResponseDtoNull()
  async deletePricing(
    @Param('id', ParseIntPipe) id: number,
    @Param('subServiceId', ParseIntPipe) subServiceId: number,
  ): Promise<ResponseDto<null>> {
    await this._serviceLocationService.deletePricingAsync(id, subServiceId);
    return ResponseDto.deleted('Pricing ceiling removed');
  }
}
