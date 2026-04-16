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
import { DriverListDto } from './dto/driver-list.dto';
import { UploadDriverDocumentDto } from './dto/upload-driver-document.dto';

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
  async create(
    @Body() createDriverDto: VendorCreateDriverDto,
  ): Promise<DriverDetailDto> {
    return await this._driverService.createAsync(createDriverDto as CreateDriverDto);
  }

  /**
   * Get all drivers belonging to the vendor
   * @param active_tab Optional status filter
   */
  @UseGuards(VendorGuard)
  @Get()
  @ApiQuery({ name: 'active_tab', enum: DriverStatus, required: false })
  async findAll(@Query('active_tab') active_tab?: DriverStatus): Promise<DriverListDto[]> {
    return await this._driverService.getListAsync(active_tab);
  }

  /**
   * Get details of a specific driver
   * @param id Driver ID
   */
  @UseGuards(VendorGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<DriverDetailDto> {
    return await this._driverService.getByIdAsync(id);
  }

  /**
   * Update driver information
   * @param id Driver ID
   * @param updateDriverDto 
   */
  @UseGuards(VendorGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDriverDto: VendorUpdateDriverDto,
  ): Promise<DriverDetailDto> {
    return await this._driverService.updateAsync(id, updateDriverDto as UpdateDriverDto);
  }

  /**
   * Delete a driver (Soft delete)
   * @param id Driver ID
   */
  @UseGuards(VendorGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const deletedById = this._callerService.getUserId();
    return await this._driverService.deleteAsync(id, deletedById);
  }

  /**
   * Submits a driver for approval.
   * Changes status to UnderApproval after validating all required fields and documents.
   *
   * @param id - Driver ID
   */
  @UseGuards(VendorGuard)
  @Patch(':id/submit-for-approval')
  @ApiOperation({ summary: 'Submit driver for approval' })
  async submitForApproval(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DriverDetailDto> {
    return await this._driverService.submitForApprovalAsync(id);
  }

  /**
   * Directly status a driver to Banned (Vendor Access).
   *
   * @param id - Driver ID
   */
  @UseGuards(VendorGuard)
  @Patch(':id/ban')
  @ApiOperation({ summary: 'Ban a driver' })
  async ban(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DriverDetailDto> {
    return await this._driverService.banAsync(id);
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadDriverAadharCard(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.ensureFileProvided(file, 'Aadhaar card');
    return await this._driverService.uploadDocumentAsync(id, 'aadhar', file);
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadDriverPanCard(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.ensureFileProvided(file, 'PAN card');
    return await this._driverService.uploadDocumentAsync(id, 'pan', file);
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadDriverLicense(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.ensureFileProvided(file, 'Driver License');
    return await this._driverService.uploadDocumentAsync(id, 'license', file);
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
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDriverImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.ensureFileProvided(file, 'Driver Profile Image');
    return await this._driverService.uploadDocumentAsync(id, 'profile_image', file);
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
