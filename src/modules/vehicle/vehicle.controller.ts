import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Query,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, VendorCreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto, VendorUpdateVehicleDto } from './dto/update-vehicle.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  ApiBearerAuth,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';
import { VehicleDetailDto } from './dto/vehicle-detail.dto';
import { VehicleListDto, VehiclePaginatedListDto } from './dto/vehicle-list.dto';
import { UploadVehicleFilesDto } from './dto/upload-vehicle-files.dto';
import { VehicleStatus, VehicleAvailabilityStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedListDto } from '../../core/response/dto/paginated-list.dto';

import {
  ResponseDto,
} from 'src/core/response/dto/response.dto';
import {
  ApiResponseDto,
  ApiResponseDtoNull,
} from 'src/core/response/decorators/api-response-dto.decorator';

@ApiExtraModels(
  CreateVehicleDto,
  UpdateVehicleDto,
  UploadVehicleFilesDto,
  ResponseDto,
  VehicleListDto,
  VehicleDetailDto,
)
@Controller('vehicle')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Vehicle')
export class VehicleController {
  constructor(private readonly _vehicleService: VehicleService) { }

  // #region Create
  /**
   * Register a new vehicle (JSON)
   * @param createVehicleDto 
   */
  @Post()
  @ApiResponseDto(VehicleDetailDto, false, 201)
  async create(
    @Body() createVehicleDto: VendorCreateVehicleDto,
  ): Promise<ResponseDto<VehicleDetailDto>> {
    const vehicle = await this._vehicleService.createAsync(createVehicleDto as CreateVehicleDto);
    return ResponseDto.created('Vehicle registered successfully', vehicle);
  }
  // #endregion

  // #region Get
  /**
   * Get all vehicles belonging to the vendor
   * @param active_tab Optional status filter
   */
  @Get()
  @ApiResponseDto(VehiclePaginatedListDto)
  @ApiQuery({ name: 'active_tab', enum: VehicleStatus, required: false })
  async findAll(@Query('active_tab') active_tab?: VehicleStatus): Promise<ResponseDto<PaginatedListDto<VehicleListDto>>> {
    const data = await this._vehicleService.getListAsync(active_tab);
    return ResponseDto.retrieved('Vehicles retrieved successfully', data);
  }

  /**
   * Get all available vehicles belonging to the vendor
   */
  @Get('available')
  @ApiResponseDto(VehicleListDto, true)
  async findAvailable(): Promise<ResponseDto<VehicleListDto[]>> {
    const vehicles = await this._vehicleService.getAvailableListAsync();
    return ResponseDto.retrieved('Available vehicles retrieved successfully', vehicles);
  }

  /**
   * Get details of a specific vehicle
   * @param id Vehicle ID
   */
  @Get(':id')
  @ApiResponseDto(VehicleDetailDto)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<VehicleDetailDto>> {
    const vehicle = await this._vehicleService.getByIdAsync(id);
    return ResponseDto.retrieved('Vehicle details retrieved successfully', vehicle);
  }
  // #endregion

  // #region Update
  /**
   * Update vehicle information (JSON)
   * @param id Vehicle ID
   * @param updateVehicleDto 
   */
  @Put(':id')
  @ApiResponseDto(VehicleDetailDto)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: VendorUpdateVehicleDto,
  ): Promise<ResponseDto<VehicleDetailDto>> {
    const vehicle = await this._vehicleService.updateAsync(id, updateVehicleDto as UpdateVehicleDto);
    return ResponseDto.updated('Vehicle updated successfully', vehicle);
  }
  // #endregion

  // #region Approval
  /**
   * Submit vehicle for approval (Sets status to Available)
   * @param id Vehicle ID
   */
  @Put(':id/submit-for-approval')
  @ApiResponseDto(VehicleDetailDto)
  async submitForApproval(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<VehicleDetailDto>> {
    const vehicle = await this._vehicleService.submitForApprovalAsync(id);
    return ResponseDto.updated('Vehicle submitted for approval successfully', vehicle);
  }

  /**
   * Ban a vehicle (Sets status to Banned)
   * @param id Vehicle ID
   */
  @Put(':id/ban')
  @ApiResponseDto(VehicleDetailDto)
  async ban(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<VehicleDetailDto>> {
    const vehicle = await this._vehicleService.banAsync(id);
    return ResponseDto.updated('Vehicle banned successfully', vehicle);
  }
  // #endregion

  // #region Document Upload
  /**
   * Upload multiple vehicle images
   * @param id Vehicle ID
   * @param files Array of image files
   */
  @Put(':id/vehicle-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFilesDto })
  @UseInterceptors(FilesInterceptor('files', 4))
  async uploadVehicleImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._vehicleService.uploadFilesAsync(id, 'vehical_image', files);
    return ResponseDto.updated('Vehicle images uploaded successfully', result);
  }

  /**
   * Upload multiple chassis images
   * @param id Vehicle ID
   * @param files Array of image files
   */
  @Put(':id/chassis-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFilesDto })
  @UseInterceptors(FilesInterceptor('files', 4))
  async uploadChassisImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._vehicleService.uploadFilesAsync(id, 'chassis_image', files);
    return ResponseDto.updated('Chassis images uploaded successfully', result);
  }

  /**
   * Upload multiple tax images
   * @param id Vehicle ID
   * @param files Array of image files
   */
  @Put(':id/tax-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFilesDto })
  @UseInterceptors(FilesInterceptor('files', 4))
  async uploadTaxImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._vehicleService.uploadFilesAsync(id, 'tax_image', files);
    return ResponseDto.updated('Tax images uploaded successfully', result);
  }

  /**
   * Upload multiple insurance images
   * @param id Vehicle ID
   * @param files Array of image files
   */
  @Put(':id/insurance-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFilesDto })
  @UseInterceptors(FilesInterceptor('files', 4))
  async uploadInsuranceImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._vehicleService.uploadFilesAsync(id, 'insurance_image', files);
    return ResponseDto.updated('Insurance images uploaded successfully', result);
  }

  /**
   * Upload multiple fitness images
   * @param id Vehicle ID
   * @param files Array of image files
   */
  @Put(':id/fitness-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFilesDto })
  @UseInterceptors(FilesInterceptor('files', 4))
  async uploadFitnessImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._vehicleService.uploadFilesAsync(id, 'fitness_image', files);
    return ResponseDto.updated('Fitness images uploaded successfully', result);
  }

  /**
   * Upload multiple PUC images
   * @param id Vehicle ID
   * @param files Array of image files
   */
  @Put(':id/puc-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFilesDto })
  @UseInterceptors(FilesInterceptor('files', 4))
  async uploadPucImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._vehicleService.uploadFilesAsync(id, 'puc_image', files);
    return ResponseDto.updated('PUC images uploaded successfully', result);
  }
  // #endregion

  // #region Delete
  /**
   * Delete a vehicle (Soft delete)
   * @param id Vehicle ID
   */
  @Delete(':id')
  @ApiResponseDtoNull()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<null>> {
    await this._vehicleService.deleteAsync(id);
    return ResponseDto.deleted('Vehicle deleted successfully');
  }
  // #endregion
}
