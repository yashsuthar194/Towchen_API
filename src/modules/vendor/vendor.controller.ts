import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { VendorListDto } from './dto/vendor-list.dto';
import { VendorDetailDto } from './dto/vendor-detail.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { VendorUploadFilesPostDto } from './dto/vendor-upload-files.post.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorUploadFilesPutDto } from './dto/vendor-upload-files.put.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import {
  ApiResponseDto,
  ApiResponseDtoNull,
} from 'src/core/response/decorators/api-response-dto.decorator';

@ApiExtraModels(
  VendorUploadFilesPostDto,
  CreateVendorDto,
  VendorUploadFilesPutDto,
  UpdateVendorDto,
  ResponseDto,
  VendorListDto,
  VendorDetailDto,
)
@Controller('vendor')
export class VendorController {
  constructor(private readonly _vendorService: VendorService) {}

  /**
   * Retrieves a list of all vendors with basic information
   *
   * @returns Promise resolving to standardized response with vendor list
   */
  @Get('list')
  @ApiResponseDto(VendorListDto, true, 200)
  async getListAsync(): Promise<ResponseDto<VendorListDto[]>> {
    const vendors = await this._vendorService.getListAsync();
    return ResponseDto.retrieved('Vendors retrieved successfully', vendors);
  }

  /**
   * Retrieves detailed information for a specific vendor by ID
   *
   * @param id - Vendor ID
   * @returns Promise resolving to standardized response with vendor details
   */
  @Get(':id')
  @ApiResponseDto(VendorDetailDto, false, 200)
  async getByIdAsync(
    @Param('id') id: number,
  ): Promise<ResponseDto<VendorDetailDto>> {
    const vendor = await this._vendorService.getByIdAsync(id);
    return ResponseDto.retrieved(
      'Vendor details retrieved successfully',
      vendor,
    );
  }

  /**
   * Creates a new vendor with document uploads
   *
   * @remarks
   * This endpoint accepts multipart/form-data with the following fields:
   * - vendor_image: Vendor profile image (required)
   * - pan_card: PAN card document (required)
   * - adhar_card: Aadhaar card document (required)
   * - gst_certification: GST certificate document (required)
   * - org_certification: Organization certificate document (required)
   *
   * All other vendor data should be sent as form fields matching CreateVendorDto
   *
   * @param dto - Vendor creation data
   * @param files - Uploaded document files
   * @returns Promise resolving to created vendor details
   *
   * @example
   * POST /vendor
   * Content-Type: multipart/form-data
   *
   * Fields:
   * - full_name: "John Doe"
   * - email: "john@example.com"
   * - vendor_image: [file]
   * - pan_card: [file]
   * - etc.
   */
  @Post()
  @ApiResponseDto(VendorDetailDto, false, 201)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateVendorDto) },
        { $ref: getSchemaPath(VendorUploadFilesPostDto) },
      ],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'vendor_image', maxCount: 1 },
      { name: 'pan_card', maxCount: 1 },
      { name: 'adhar_card', maxCount: 1 },
      { name: 'gst_certification', maxCount: 1 },
      { name: 'org_certification', maxCount: 1 },
      { name: 'bank_detail', maxCount: 1 },
    ]),
  )
  async createAsync(
    @Body() dto: CreateVendorDto,
    @UploadedFiles() files: VendorUploadFilesPostDto,
  ): Promise<ResponseDto<VendorDetailDto>> {
    const vendor = await this._vendorService.createAsync(dto, files);
    return ResponseDto.created('Vendor created successfully', vendor);
  }

  /**
   * Updates an existing vendor with new data and document uploads
   *
   * @param id - Vendor ID
   * @param dto - Vendor update data
   * @param files - Uploaded document files
   * @returns Promise resolving to updated vendor details
   */
  @Put(':id')
  @ApiResponseDto(VendorDetailDto, false, 200)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateVendorDto) },
        { $ref: getSchemaPath(VendorUploadFilesPutDto) },
      ],
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'vendor_image' },
      { name: 'pan_card' },
      { name: 'adhar_card' },
      { name: 'gst_certification' },
      { name: 'org_certification' },
      { name: 'bank_detail' },
    ]),
  )
  async updateAsync(
    @Param('id') id: number,
    @Body() dto: UpdateVendorDto,
    @UploadedFiles() files: VendorUploadFilesPutDto,
  ): Promise<ResponseDto<VendorDetailDto>> {
    const vendor = await this._vendorService.updateAsync(dto, files, id);
    return ResponseDto.updated('Vendor updated successfully', vendor);
  }

  @Delete(':id')
  @ApiResponseDtoNull(200)
  async deleteAsync(@Param('id') id: number): Promise<ResponseDto<null>> {
    await this._vendorService.deleteAsync(id);
    return ResponseDto.deleted('Vendor deleted successfully');
  }
}
