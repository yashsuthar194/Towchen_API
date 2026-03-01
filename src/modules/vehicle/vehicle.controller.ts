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
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VehicleUploadFilesPostDto } from './dto/vehicle-upload-files.post.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';
import { VehicleDetailDto } from './dto/vehicle-detail.dto';
import { VehicleListDto } from './dto/vehicle-list.dto';
import { VehicleUploadFilesPutDto } from './dto/vehicle-upload-files.put.dto';

@ApiExtraModels(VehicleUploadFilesPostDto, CreateVehicleDto, UpdateVehicleDto, VehicleUploadFilesPutDto)
@Controller('vehicle')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth('JWT-auth')
export class VehicleController {
  constructor(private readonly _vehicleService: VehicleService) { }

  /**
   * Register a new vehicle with documents
   * @param createVehicleDto 
   * @param files 
   */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateVehicleDto) },
        { $ref: getSchemaPath(VehicleUploadFilesPostDto) },
      ],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'vehical_image', maxCount: 4 },
      { name: 'chassis_image', maxCount: 4 },
      { name: 'tax_image', maxCount: 4 },
      { name: 'insurance_image', maxCount: 4 },
      { name: 'fitness_image', maxCount: 4 },
      { name: 'puc_image', maxCount: 4 },
    ]),
  )
  async create(
    @Body() createVehicleDto: CreateVehicleDto,
    @UploadedFiles() files: VehicleUploadFilesPostDto,
  ): Promise<VehicleDetailDto> {
    return await this._vehicleService.createAsync(createVehicleDto, files);
  }

  /**
   * Get all vehicles belonging to the vendor
   */
  @Get()
  async findAll(): Promise<VehicleListDto[]> {
    return await this._vehicleService.getListAsync();
  }

  /**
   * Get details of a specific vehicle
   * @param id Vehicle ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<VehicleDetailDto> {
    return await this._vehicleService.getByIdAsync(id);
  }

  /**
   * Update vehicle information
   * @param id Vehicle ID
   * @param updateVehicleDto 
   * @param files Optional image updates
   */
  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateVehicleDto) },
        { $ref: getSchemaPath(VehicleUploadFilesPutDto) },
      ],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'vehical_image', maxCount: 4 },
      { name: 'chassis_image', maxCount: 4 },
      { name: 'tax_image', maxCount: 4 },
      { name: 'insurance_image', maxCount: 4 },
      { name: 'fitness_image', maxCount: 4 },
      { name: 'puc_image', maxCount: 4 },
    ]),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @UploadedFiles() files: VehicleUploadFilesPutDto,
  ): Promise<VehicleDetailDto> {
    return await this._vehicleService.updateAsync(id, updateVehicleDto, files);
  }

  /**
   * Delete a vehicle (Soft delete)
   * @param id Vehicle ID
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this._vehicleService.deleteAsync(id);
  }
}
