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
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DriverUploadFilesPostDto } from './dto/driver-upload-files.post.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';
import { DriverDetailDto } from './dto/driver-detail.dto';
import { DriverListDto } from './dto/driver-list.dto';
import { DriverUploadFilesPutDto } from './dto/driver-upload-files.put.dto';

@ApiExtraModels(DriverUploadFilesPostDto, CreateDriverDto, UpdateDriverDto, DriverUploadFilesPutDto)
@Controller('driver')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth('JWT-auth')
export class DriverController {
  constructor(private readonly _driverService: DriverService) { }

  /**
   * Register a new driver with documents
   * @param createDriverDto 
   * @param files 
   */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateDriverDto) },
        { $ref: getSchemaPath(DriverUploadFilesPostDto) },
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
  async create(
    @Body() createDriverDto: CreateDriverDto,
    @UploadedFiles() files: DriverUploadFilesPostDto,
  ): Promise<DriverDetailDto> {
    return await this._driverService.createAsync(createDriverDto, files);
  }

  /**
   * Get all drivers belonging to the vendor
   */
  @Get()
  async findAll(): Promise<DriverListDto[]> {
    return await this._driverService.getListAsync();
  }

  /**
   * Get details of a specific driver
   * @param id Driver ID
   */
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
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this._driverService.deleteAsync(id);
  }
}
