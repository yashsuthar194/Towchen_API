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
import { CreateVehicleDto, VendorCreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto, VendorUpdateVehicleDto } from './dto/update-vehicle.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { VehicleUploadFilesPostDto } from './dto/vehicle-upload-files.post.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';
import { VehicleDetailDto } from './dto/vehicle-detail.dto';
import { VehicleListDto } from './dto/vehicle-list.dto';
import { VehicleUploadFilesPutDto } from './dto/vehicle-upload-files.put.dto';

import {
  ResponseDto,
} from 'src/core/response/dto/response.dto';
import {
  ApiResponseDto,
  ApiResponseDtoNull,
} from 'src/core/response/decorators/api-response-dto.decorator';

@ApiExtraModels(
  VehicleUploadFilesPostDto,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleUploadFilesPutDto,
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
   * Register a new vehicle with documents
   * @param createVehicleDto 
   * @param files 
   */
  @Post()
  @ApiResponseDto(VehicleDetailDto, false, 201)
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
    @Body() createVehicleDto: VendorCreateVehicleDto,
    @UploadedFiles() files: VehicleUploadFilesPostDto,
  ): Promise<ResponseDto<VehicleDetailDto>> {
    const vehicle = await this._vehicleService.createAsync(createVehicleDto as CreateVehicleDto, files);
    return ResponseDto.created('Vehicle registered successfully', vehicle);
  }
  // #endregion

  // #region Get
  /**
   * Get all vehicles belonging to the vendor
   */
  @Get()
  @ApiResponseDto(VehicleListDto, true)
  async findAll(): Promise<ResponseDto<VehicleListDto[]>> {
    const vehicles = await this._vehicleService.getListAsync();
    return ResponseDto.retrieved('Vehicles retrieved successfully', vehicles);
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
   * Update vehicle information
   * @param id Vehicle ID
   * @param updateVehicleDto 
   * @param files Optional image updates
   */
  @Put(':id')
  @ApiResponseDto(VehicleDetailDto)
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
    @Body() updateVehicleDto: VendorUpdateVehicleDto,
    @UploadedFiles() files: VehicleUploadFilesPutDto,
  ): Promise<ResponseDto<VehicleDetailDto>> {
    const vehicle = await this._vehicleService.updateAsync(id, updateVehicleDto as UpdateVehicleDto, files);
    return ResponseDto.updated('Vehicle updated successfully', vehicle);
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
