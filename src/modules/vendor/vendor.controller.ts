import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
import { VendorUploadFilesDto } from './dto/vendor-upload-files.dto';

@ApiExtraModels(VendorUploadFilesDto, CreateVendorDto)
@Controller('vendor')
export class VendorController {
  constructor(private readonly _vendorService: VendorService) {}

  /**
   * Retrieves a list of all vendors with basic information
   *
   * @returns Promise resolving to array of vendor list items
   */
  @Get('list')
  async getListAsync(): Promise<VendorListDto[]> {
    return this._vendorService.getListAsync();
  }

  /**
   * Retrieves detailed information for a specific vendor by ID
   *
   * @param id - Vendor ID
   * @returns Promise resolving to vendor details including bank information
   */
  @Get(':id')
  async getByIdAsync(@Param('id') id: number): Promise<VendorDetailDto> {
    return this._vendorService.getByIdAsync(id);
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateVendorDto) },
        { $ref: getSchemaPath(VendorUploadFilesDto) },
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
    @UploadedFiles() files: VendorUploadFilesDto,
  ): Promise<VendorDetailDto> {
    return this._vendorService.createAsync(dto, files);
  }
}
