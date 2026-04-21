import {
  Controller,
  Get,
  Put,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Delete,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiTags,
  getSchemaPath,
  ApiExtraModels,
  ApiOperation,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { DriverGuard } from 'src/services/jwt/guards/driver.guard';
import { CallerService } from 'src/services/jwt/caller.service';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UploadDriverDocumentDto } from './dto/upload-driver-document.dto';
import { DriverDetailDto } from './dto/driver-detail.dto';

@ApiTags('Driver Profile')
@ApiExtraModels(UpdateDriverProfileDto)
@Controller('driver/profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DriverProfileController {
  constructor(
    private readonly _driverService: DriverService,
    private readonly _callerService: CallerService,
  ) {}

  /**
   * Get current driver profile
   */
  @Get('me')
  async getProfile(): Promise<DriverDetailDto> {
    const driverId = this._callerService.getUserId();
    return await this._driverService.getProfileAsync(driverId);
  }


  /**
   * Update current driver's personal info (JSON only, no files)
   */
  @Put('me/info')
  @ApiOperation({ summary: 'Update driver profile information (JSON)' })
  @ApiBody({ type: UpdateDriverProfileDto })
  async updateProfileInfo(
    @Body() dto: UpdateDriverProfileDto,
  ): Promise<DriverDetailDto> {
    const driverId = this._callerService.getUserId();
    return await this._driverService.updateProfileAsync(driverId, dto);
  }

  /**
   * Delete current driver account
   */
  @Delete('me')
  @ApiOperation({ summary: 'Delete current driver account' })
  async deleteProfile() {
    const driverId = this._callerService.getUserId();
    return await this._driverService.deleteAsync(driverId, driverId);
  }

  // #region Individual Document Uploads (For Drivers)

  /**
   * Uploads or replaces current driver's Aadhaar card document.
   */
  @UseGuards(DriverGuard)
  @Put('document/aadhar-card')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyAadharCard(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const driverId = this._callerService.getUserId();
    this.ensureFileProvided(file, 'Aadhaar card');
    return await this._driverService.uploadDocumentAsync(driverId, 'aadhar', file);
  }

  /**
   * Uploads or replaces current driver's PAN card document.
   */
  @UseGuards(DriverGuard)
  @Put('document/pan-card')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyPanCard(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const driverId = this._callerService.getUserId();
    this.ensureFileProvided(file, 'PAN card');
    return await this._driverService.uploadDocumentAsync(driverId, 'pan', file);
  }

  /**
   * Uploads or replaces current driver's License document.
   */
  @UseGuards(DriverGuard)
  @Put('document/driver-license')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyLicense(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const driverId = this._callerService.getUserId();
    this.ensureFileProvided(file, 'Driver License');
    return await this._driverService.uploadDocumentAsync(driverId, 'license', file);
  }

  /**
   * Uploads or replaces current driver's profile image.
   */
  @UseGuards(DriverGuard)
  @Put('document/driver-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadDriverDocumentDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMyImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const driverId = this._callerService.getUserId();
    this.ensureFileProvided(file, 'Driver Profile Image');
    return await this._driverService.uploadDocumentAsync(driverId, 'profile_image', file);
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
