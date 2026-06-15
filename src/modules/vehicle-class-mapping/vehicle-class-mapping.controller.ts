import { Controller, Get, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehicleClassMappingService } from './vehicle-class-mapping.service';
import { CreateVehicleClassConfigDto } from './dto/create-config.dto';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { StorageService } from 'src/services/storage/storage.service';
import { FileHelper } from 'src/shared/helper/file-helper';

@ApiTags('Vehicle Class Mapping & Config')
@Controller('vehicle-class-mapping')
export class VehicleClassMappingController {
  constructor(
    private readonly _service: VehicleClassMappingService,
    private readonly _storageService: StorageService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add or update a vehicle class configuration' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { fileFilter: FileHelper.imageFilter }))
  async createConfig(
    @Body() dto: CreateVehicleClassConfigDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let diagramImageUrl: string | undefined;

    if (file) {
      const uploadResult = await this._storageService.uploadFileAsync({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        folderPath: 'vehicle-class-diagrams',
      });
      diagramImageUrl = uploadResult.url;
    }

    const result = await this._service.createOrUpdateConfigAsync(dto, diagramImageUrl);
    return ResponseDto.created('Configuration created/updated successfully', result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vehicle class configurations' })
  async findAllConfigs() {
    const result = await this._service.getConfigsAsync();
    return ResponseDto.retrieved('Configurations retrieved successfully', result);
  }
}
