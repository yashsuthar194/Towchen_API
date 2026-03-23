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
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';
import { DriverGuard } from 'src/services/jwt/guards/driver.guard';
import { CallerService } from 'src/services/jwt/caller.service';
import { DriverDetailDto } from './dto/driver-detail.dto';
import { DriverListDto } from './dto/driver-list.dto';
import { DriverUploadFilesPutDto } from './dto/driver-upload-files.put.dto';
import { UploadDriverDocumentDto } from './dto/upload-driver-document.dto';

@ApiExtraModels(CreateDriverDto, UpdateDriverDto, DriverUploadFilesPutDto, UploadDriverDocumentDto)
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
    @Body() createDriverDto: CreateDriverDto,
  ): Promise<DriverDetailDto> {
    return await this._driverService.createAsync(createDriverDto);
  }

  /**
   * Get all drivers belonging to the vendor
   */
  @UseGuards(VendorGuard)
  @Get()
  async findAll(): Promise<DriverListDto[]> {
    return await this._driverService.getListAsync();
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
   * @param files Optional document updates
   */
  @UseGuards(VendorGuard)
  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateDriverDto) },
        { $ref: getSchemaPath(DriverUploadFilesPutDto) },
      ],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'aadhar_card', maxCount: 1 },
      { name: 'pan_card', maxCount: 1 },
      { name: 'driver_license', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDriverDto: UpdateDriverDto,
    @UploadedFiles() files: DriverUploadFilesPutDto,
  ): Promise<DriverDetailDto> {
    return await this._driverService.updateAsync(id, updateDriverDto, files);
  }

  /**
   * Delete a driver (Soft delete)
   * @param id Driver ID
   */
  @UseGuards(VendorGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this._driverService.deleteAsync(id);
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
  // #endregion

  // #region Document Upload (Self-Service)
  /**
   * Uploads or replaces the authenticated driver's Aadhaar card document.
   *
   * @param file - Aadhaar card file (PDF, JPEG, PNG)
   */
  @UseGuards(DriverGuard)
  @Put('document/aadhar-card')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyAadharCard(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.ensureFileProvided(file, 'Aadhaar card');
    const driverId = this._callerService.getUserId();
    return await this._driverService.uploadDocumentAsync(driverId, 'aadhar', file);
  }

  /**
   * Uploads or replaces the authenticated driver's PAN card document.
   *
   * @param file - PAN card file (PDF, JPEG, PNG)
   */
  @UseGuards(DriverGuard)
  @Put('document/pan-card')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyPanCard(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.ensureFileProvided(file, 'PAN card');
    const driverId = this._callerService.getUserId();
    return await this._driverService.uploadDocumentAsync(driverId, 'pan', file);
  }

  /**
   * Uploads or replaces the authenticated driver's License document.
   *
   * @param file - License file (PDF, JPEG, PNG)
   */
  @UseGuards(DriverGuard)
  @Put('document/driver-license')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyDriverLicense(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    this.ensureFileProvided(file, 'Driver License');
    const driverId = this._callerService.getUserId();
    return await this._driverService.uploadDocumentAsync(driverId, 'license', file);
  }

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
