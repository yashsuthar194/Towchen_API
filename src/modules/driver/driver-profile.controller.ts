import {
  Controller,
  Get,
  Put,
  Body,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiTags,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CallerService } from 'src/services/jwt/caller.service';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { DriverUploadFilesPutDto } from './dto/driver-upload-files.put.dto';
import { DriverDetailDto } from './dto/driver-detail.dto';

@ApiTags('Driver Profile')
@ApiExtraModels(UpdateDriverProfileDto, DriverUploadFilesPutDto)
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
   * Update current driver profile
   */
  @Put('me')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateDriverProfileDto) },
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
  async updateProfile(
    @Body() dto: UpdateDriverProfileDto,
    @UploadedFiles() files: DriverUploadFilesPutDto,
  ): Promise<DriverDetailDto> {
    const driverId = this._callerService.getUserId();
    return await this._driverService.updateProfileAsync(driverId, dto, files);
  }
}
