import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { VendorListDto } from './dto/vendor-list.dto';
import { VendorDetailDto } from './dto/vendor-detail.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { VendorUploadFilesDto } from './interfaces';
import { StorageService } from 'src/services/storage/storage.service';

@Injectable()
export class VendorService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _storageService: StorageService,
  ) {}

  /**
   * Get list data
   * @returns
   */
  async getListAsync(): Promise<VendorListDto[]> {
    return await this._prismaService.vendor.findMany({
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        formated_id: true,
        full_name: true,
        email: true,
        number: true,
        services: true,
        approved_by: true,
        status: true,
        created_at: true,
      },
    });
  }

  /**
   * Get vendor by id
   * @param id
   * @returns
   */
  async getByIdAsync(id: number): Promise<VendorDetailDto> {
    return await this._prismaService.vendor.findFirstOrThrow({
      select: {
        id: true,
        formated_id: true,
        full_name: true,
        email: true,
        number: true,
        is_email_verified: true,
        vendor_image_url: true,
        services: true,
        pan_card_url: true,
        adhar_card_url: true,
        org_name: true,
        org_number: true,
        org_alternate_number: true,
        org_certificate_url: true,
        org_email: true,
        gst_number: true,
        gst_certificate_url: true,
        approved_by: true,
        status: true,
        created_at: true,
        updated_at: true,
        bank_detail: true,
      },
      where: {
        id,
      },
    });
  }

  /**
   * Creates a new vendor with uploaded documents
   *
   * @param dto - Vendor creation data
   * @param files - Uploaded files object containing all required documents
   * @returns Promise resolving to created vendor details
   * @throws {BadRequestException} If any required file is missing
   */
  async createAsync(
    dto: CreateVendorDto,
    files: VendorUploadFilesDto,
  ): Promise<VendorDetailDto> {
    // Validate required files
    // this.validateRequiredFiles(files);

    // Upload all files to storage in parallel
    const [
      vendorImageResult,
      panCardResult,
      adharCardResult,
      gstCertResult,
      orgCertResult,
    ] = await Promise.all([
      this.uploadFileAsync(files.vendor_image![0], 'vendor/images'),
      this.uploadFileAsync(files.pan_card![0], 'vendor/documents/pan'),
      this.uploadFileAsync(files.adhar_card![0], 'vendor/documents/adhar'),
      this.uploadFileAsync(files.gst_certification![0], 'vendor/documents/gst'),
      this.uploadFileAsync(files.org_certification![0], 'vendor/documents/org'),
    ]);

    // Create vendor with uploaded file URLs
    return this._prismaService.vendor.create({
      data: {
        ...dto,
        status: 'Pending',
        vendor_image_url: vendorImageResult.url,
        pan_card_url: panCardResult.url,
        adhar_card_url: adharCardResult.url,
        gst_certificate_url: gstCertResult.url,
        org_certificate_url: orgCertResult.url,
      },
      select: {
        id: true,
        formated_id: true,
        full_name: true,
        email: true,
        number: true,
        is_email_verified: true,
        vendor_image_url: true,
        services: true,
        pan_card_url: true,
        adhar_card_url: true,
        org_name: true,
        org_number: true,
        org_alternate_number: true,
        org_certificate_url: true,
        org_email: true,
        gst_number: true,
        gst_certificate_url: true,
        approved_by: true,
        status: true,
        created_at: true,
        updated_at: true,
        bank_detail: true,
      },
    });
  }

  /**
   * Validates that all required files are present
   *
   * @param files - Uploaded files object
   * @throws {BadRequestException} If any required file is missing
   * @private
   */
  private validateRequiredFiles(files: VendorUploadFilesDto): void {
    const requiredFiles: (keyof VendorUploadFilesDto)[] = [
      'vendor_image',
      'pan_card',
      'adhar_card',
      'gst_certification',
      'org_certification',
    ];

    const missingFiles = requiredFiles.filter((field) => !files[field]);

    if (missingFiles.length > 0) {
      throw new BadRequestException(
        `Missing required files: ${missingFiles.join(', ')}`,
      );
    }
  }

  /**
   * Uploads a single file to storage
   *
   * @param file - Multer file object
   * @param folderPath - Destination folder path in storage
   * @returns Promise resolving to file upload result
   * @private
   */
  private async uploadFileAsync(file: Express.Multer.File, folderPath: string) {
    return this._storageService.uploadFileAsync({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      folderPath,
    });
  }
}
