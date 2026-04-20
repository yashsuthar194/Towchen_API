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
  BadRequestException,
  Patch,
  Query,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto, VendorCreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto, VendorUpdateDriverDto } from './dto/update-driver.dto';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { DriverStatus } from '@prisma/client';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';
import { CallerService } from 'src/services/jwt/caller.service';
import { DriverDetailDto } from './dto/driver-detail.dto';
import { DriverListDto, DriverPaginatedListDto } from './dto/driver-list.dto';
import { UploadDriverDocumentDto } from './dto/upload-driver-document.dto';
import { UploadDriverImageDto } from './dto/upload-driver-image.dto';
import { PaginatedListDto } from '../../core/response/dto/paginated-list.dto';
import { ApiResponseDto } from '../../core/response/decorators/api-response-dto.decorator';
import { FileHelper } from 'src/shared/helper/file-helper';
import { ResponseDto } from '../../core/response/dto/response.dto';

@ApiExtraModels(CreateDriverDto, UpdateDriverDto, UploadDriverDocumentDto)
@Controller('driver')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DriverController {
  constructor(
    private readonly _driverService: DriverService,
    private readonly _callerService: CallerService,
  ) { }

  /**
   * Register a new driver with documents
   * @param createDriverDto 
   */
  @UseGuards(VendorGuard)
  @Post()
  @ApiResponseDto(DriverDetailDto, false, 201)
  async create(
    @Body() createDriverDto: VendorCreateDriverDto,
  ): Promise<ResponseDto<DriverDetailDto>> {
    const result = await this._driverService.createAsync(createDriverDto as CreateDriverDto);
    return ResponseDto.created('Driver registered successfully', result);
  }

  /**
   * Get all drivers belonging to the vendor
   * @param active_tab Optional status filter
   */
  @UseGuards(VendorGuard)
  @Get()
  @ApiResponseDto(DriverPaginatedListDto)
  @ApiQuery({ name: 'active_tab', enum: DriverStatus, required: false })
  async findAll(@Query('active_tab') active_tab?: DriverStatus): Promise<ResponseDto<PaginatedListDto<DriverListDto>>> {
    const data = await this._driverService.getListAsync(active_tab);
    return ResponseDto.retrieved('Drivers retrieved successfully', data);
  }

  /**
   * Get details of a specific driver
   * @param id Driver ID
   */
  @UseGuards(VendorGuard)
  @Get(':id')
  @ApiResponseDto(DriverDetailDto)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<DriverDetailDto>> {
    const data = await this._driverService.getByIdAsync(id);
    return ResponseDto.retrieved('Driver details retrieved successfully', data);
  }

  /**
   * Update driver information
   * @param id Driver ID
   * @param updateDriverDto 
   */
  @UseGuards(VendorGuard)
  @Put(':id')
  @ApiResponseDto(DriverDetailDto)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDriverDto: VendorUpdateDriverDto,
  ): Promise<ResponseDto<DriverDetailDto>> {
    const result = await this._driverService.updateAsync(id, updateDriverDto as UpdateDriverDto);
    return ResponseDto.updated('Driver updated successfully', result);
  }

  /**
   * Delete a driver (Soft delete)
   * @param id Driver ID
   */
  @UseGuards(VendorGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<null>> {
    const deletedById = this._callerService.getUserId();
    await this._driverService.deleteAsync(id, deletedById);
    return ResponseDto.deleted('Driver deleted successfully');
  }

  /**
   * Update the vehicle details associated with a driver
   * @param id Driver ID
   * @param updateVehicleDto 
   */
  @UseGuards(VendorGuard)
  @Put(':id/vehicle')
  @ApiResponseDto(DriverDetailDto)
  @ApiOperation({ summary: 'Assign or unassign a vehicle to a driver' })
  async updateVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignVehicleDto: AssignVehicleDto,
  ): Promise<ResponseDto<DriverDetailDto>> {
    const result = await this._driverService.assignVehicleAsync(id, assignVehicleDto);
    const message = assignVehicleDto.vehicle_id === 0 
      ? 'Vehicle unassigned successfully' 
      : 'Vehicle assigned successfully';
    return ResponseDto.updated(message, result);
  }

  /**
   * Submits a driver for approval.
   * Changes status to UnderApproval after validating all required fields and documents.
   *
   * @param id - Driver ID
   */
  @UseGuards(VendorGuard)
  @Put(':id/submit-for-approval')
  @ApiResponseDto(DriverDetailDto)
  @ApiOperation({ summary: 'Submit driver for approval' })
  async submitForApproval(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<DriverDetailDto>> {
    const result = await this._driverService.submitForApprovalAsync(id);
    return ResponseDto.updated('Driver submitted for approval successfully', result);
  }

  /**
   * Directly status a driver to Banned (Vendor Access).
   *
   * @param id - Driver ID
   */
  @UseGuards(VendorGuard)
  @Put(':id/ban')
  @ApiResponseDto(DriverDetailDto)
  @ApiOperation({ summary: 'Ban a driver' })
  async ban(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<DriverDetailDto>> {
    const result = await this._driverService.banAsync(id);
    return ResponseDto.updated('Driver banned successfully', result);
  }

  // #region Document Upload (For Vendors)
  /**
   * Uploads or replaces a driver's Aadhaar card document (Vendor Access).
   *
   * @param id - Driver ID
   * @param file - Aadhaar card file
   */
  @UseGuards(VendorGuard)
  @Put(':id/document/aadhar-card')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file', { fileFilter: FileHelper.documentFilter }))
  async uploadDriverAadharCard(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'Aadhaar card');
    const result = await this._driverService.uploadDocumentAsync(id, 'aadhar', file);
    return ResponseDto.updated('Aadhaar card uploaded successfully', result);
  }

  /**
   * Uploads or replaces a driver's PAN card document (Vendor Access).
   *
   * @param id - Driver ID
   * @param file - PAN card file
   */
  @UseGuards(VendorGuard)
  @Put(':id/document/pan-card')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file', { fileFilter: FileHelper.documentFilter }))
  async uploadDriverPanCard(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'PAN card');
    const result = await this._driverService.uploadDocumentAsync(id, 'pan', file);
    return ResponseDto.updated('PAN card uploaded successfully', result);
  }

  /**
   * Uploads or replaces a driver's License document (Vendor Access).
   *
   * @param id - Driver ID
   * @param file - License file
   */
  @UseGuards(VendorGuard)
  @Put(':id/document/driver-license')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file', { fileFilter: FileHelper.documentFilter }))
  async uploadDriverLicense(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'Driver License');
    const result = await this._driverService.uploadDocumentAsync(id, 'license', file);
    return ResponseDto.updated('Driver license uploaded successfully', result);
  }

  /**
   * Uploads or replaces a driver's profile image (Vendor Access).
   *
   * @param id - Driver ID
   * @param file - Profile image file
   */
  @UseGuards(VendorGuard)
  @Put(':id/document/driver-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverImageDto })
  @UseInterceptors(FileInterceptor('file', { fileFilter: FileHelper.imageFilter }))
  async uploadDriverImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'Driver Profile Image');
    const result = await this._driverService.uploadDocumentAsync(id, 'profile_image', file);
    return ResponseDto.updated('Driver profile image uploaded successfully', result);
  }
  // #endregion

  // #region Helpers

  /**
   * Validates that a file was actually included in the multipart request.
   */
  private ensureFileProvided(
    file: Express.Multer.File | undefined,
    label: string,
  ): void {
    if (!file) {
      throw new BadRequestException(
        `${label} file is required. Send it as the "file" field in multipart/form-data.`,
      );
    }
  }
  // #endregion
}
