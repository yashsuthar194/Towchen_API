import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateSubServiceDto } from './dto/create-sub-service.dto';
import { UpdateSubServiceDto } from './dto/update-sub-service.dto';
import { ServiceDto, SubServiceDto } from '../vendor/dto/service.dto';
import { ServiceListDto } from './dto/service-list.dto';
import { ResponseDto } from '../../core/response/dto/response.dto';
import { ApiResponseDto, ApiResponseDtoNull } from '../../core/response/decorators/api-response-dto.decorator';

@ApiTags('Service')
@Controller('service')
export class ServiceController {
  constructor(private readonly _serviceService: ServiceService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active services' })
  @ApiResponseDto(ServiceListDto, true)
  async findAll(): Promise<ResponseDto<ServiceListDto[]>> {
    const services = await this._serviceService.findAllAsync();
    return ResponseDto.retrieved('Services retrieved successfully', services);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single service by ID' })
  @ApiResponseDto(ServiceDto)
  async findOne(@Param('id') id: number): Promise<ResponseDto<ServiceDto>> {
    const service = await this._serviceService.findOneAsync(id);
    return ResponseDto.retrieved('Service retrieved successfully', service);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponseDto(ServiceDto, false, 201)
  async createService(@Body() dto: CreateServiceDto): Promise<ResponseDto<ServiceDto>> {
    const service = await this._serviceService.createServiceAsync(dto);
    return ResponseDto.created('Service created successfully', service);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing service' })
  @ApiResponseDto(ServiceDto)
  async updateService(
    @Param('id') id: number,
    @Body() dto: UpdateServiceDto,
  ): Promise<ResponseDto<ServiceDto>> {
    const service = await this._serviceService.updateServiceAsync(id, dto);
    return ResponseDto.updated('Service updated successfully', service);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponseDtoNull()
  async deleteService(@Param('id') id: number): Promise<ResponseDto<null>> {
    await this._serviceService.deleteServiceAsync(id);
    return ResponseDto.deleted('Service deleted successfully');
  }

  // #region Sub-Service Endpoints

  @Get(':id/sub-service')
  @ApiOperation({ summary: 'Get active sub-services for a specific service' })
  @ApiResponseDto(SubServiceDto, true)
  async getSubServices(@Param('id') id: number): Promise<ResponseDto<SubServiceDto[]>> {
    const subServices = await this._serviceService.findSubServicesByServiceIdAsync(id);
    return ResponseDto.retrieved('Sub-services retrieved successfully', subServices);
  }

  @Post('sub-service')
  @ApiOperation({ summary: 'Create a new sub-service' })
  @ApiResponseDto(SubServiceDto, false, 201)
  async createSubService(@Body() dto: CreateSubServiceDto): Promise<ResponseDto<SubServiceDto>> {
    const subService = await this._serviceService.createSubServiceAsync(dto);
    return ResponseDto.created('Sub-service created successfully', subService);
  }

  @Put('sub-service/:id')
  @ApiOperation({ summary: 'Update an existing sub-service' })
  @ApiResponseDto(SubServiceDto)
  async updateSubService(
    @Param('id') id: number,
    @Body() dto: UpdateSubServiceDto,
  ): Promise<ResponseDto<SubServiceDto>> {
    const subService = await this._serviceService.updateSubServiceAsync(id, dto);
    return ResponseDto.updated('Sub-service updated successfully', subService);
  }

  @Delete('sub-service/:id')
  @ApiOperation({ summary: 'Delete a sub-service' })
  @ApiResponseDtoNull()
  async deleteSubService(@Param('id') id: number): Promise<ResponseDto<null>> {
    await this._serviceService.deleteSubServiceAsync(id);
    return ResponseDto.deleted('Sub-service deleted successfully');
  }

  // #endregion
}
