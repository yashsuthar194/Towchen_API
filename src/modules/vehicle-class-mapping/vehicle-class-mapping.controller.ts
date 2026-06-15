import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { VehicleClassMappingService } from './vehicle-class-mapping.service';
import { CreateVehicleClassMappingDto } from './dto/create-mapping.dto';
import { CreateVehicleClassConfigDto } from './dto/create-config.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ResponseDto } from 'src/core/response/dto/response.dto';

@ApiTags('Vehicle Class Mapping & Config')
@Controller('vehicle-class-mapping')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class VehicleClassMappingController {
  constructor(private readonly _service: VehicleClassMappingService) {}

  @Post()
  @ApiOperation({ summary: 'Add or update a vehicle class mapping' })
  async create(@Body() dto: CreateVehicleClassMappingDto) {
    const result = await this._service.createMappingAsync(dto);
    return ResponseDto.created('Mapping created/updated successfully', result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicle class mappings' })
  async findAll() {
    const result = await this._service.getMappingsAsync();
    return ResponseDto.retrieved('Mappings retrieved successfully', result);
  }

  @Post('config')
  @ApiOperation({ summary: 'Add or update a vehicle class configuration' })
  async createConfig(@Body() dto: CreateVehicleClassConfigDto) {
    const result = await this._service.createOrUpdateConfigAsync(dto);
    return ResponseDto.created('Configuration created/updated successfully', result);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get all vehicle class configurations' })
  async findAllConfigs() {
    const result = await this._service.getConfigsAsync();
    return ResponseDto.retrieved('Configurations retrieved successfully', result);
  }
}
