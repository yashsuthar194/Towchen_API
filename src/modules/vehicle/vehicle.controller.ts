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
  UploadedFile,
  UseGuards,
  Query,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, VendorCreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto, VendorUpdateVehicleDto } from './dto/update-vehicle.dto';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
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
import { UploadVehicleFileDto } from './dto/upload-vehicle-file.dto';
import { VehicleStatus, AvailabilityStatus } from '@prisma/client';
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
   * Submit vehicle for approval (Sets status to UnderApproval)
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
   * Upload multiple vehicle documents
   * @param id Vehicle ID
   * @param files Array of document files
   */
  @Put(':id/vehicle-document')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFilesDto })
  @UseInterceptors(FilesInterceptor('files', 4))
  async uploadVehicleDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._vehicleService.uploadDocumentsAsync(id, 'vehical_image', files);
    return ResponseDto.updated('Vehicle documents uploaded successfully', result);
  }
  /**
   * Upload single chassis document
   * @param id Vehicle ID
   * @param file The document file
   */
  @Put(':id/chassis-document')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFileDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadChassisDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    const result = await this._vehicleService.uploadDocumentAsync(id, 'chassis_image', file);
    return ResponseDto.updated('Chassis document uploaded successfully', result);
  }
  /**
   * Upload single tax document
   * @param id Vehicle ID
   * @param file The document file
   */
  @Put(':id/tax-document')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFileDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadTaxDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    const result = await this._vehicleService.uploadDocumentAsync(id, 'tax_image', file);
    return ResponseDto.updated('Tax document uploaded successfully', result);
  }
  /**
   * Upload single insurance document
   * @param id Vehicle ID
   * @param file The document file
   */
  @Put(':id/insurance-document')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFileDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadInsuranceDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    const result = await this._vehicleService.uploadDocumentAsync(id, 'insurance_image', file);
    return ResponseDto.updated('Insurance document uploaded successfully', result);
  }
  /**
   * Upload single fitness document
   * @param id Vehicle ID
   * @param file The document file
   */
  @Put(':id/fitness-document')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFileDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFitnessDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    const result = await this._vehicleService.uploadDocumentAsync(id, 'fitness_image', file);
    return ResponseDto.updated('Fitness document uploaded successfully', result);
  }
  /**
   * Upload single PUC document
   * @param id Vehicle ID
   * @param file The document file
   */
  @Put(':id/puc-document')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVehicleFileDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPucDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    const result = await this._vehicleService.uploadDocumentAsync(id, 'puc_image', file);
    return ResponseDto.updated('PUC document uploaded successfully', result);
  }  // #endregion

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
