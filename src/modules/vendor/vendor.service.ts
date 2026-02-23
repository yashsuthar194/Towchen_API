import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { VendorListDto } from './dto/vendor-list.dto';
import { VendorDetailDto } from './dto/vendor-detail.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { StorageService } from 'src/services/storage/storage.service';
import { VendorUploadFilesDto } from './dto/vendor-upload-files.dto';
import { OtpService } from '../otp/otp.service';
import { OtpType } from 'generated/prisma/client';

@Injectable()
export class VendorService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _storageService: StorageService,
    private readonly _otpService: OtpService,
  ) { }

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
    this.validateRequiredFiles(files);

    // Step 1: Create vendor record (fast DB operation)
    const vendorData = CreateVendorDto.toVendorData(dto);
    const bankDetail = CreateVendorDto.toBankDetail(dto);
    const vendor = await this._prismaService.vendor.create({
      data: {
        ...vendorData,
        formated_id: '',
        status: 'Pending',
        vendor_image_url: '',
        pan_card_url: '',
        adhar_card_url: '',
        gst_certificate_url: '',
        org_certificate_url: '',
        bank_detail: {
          create: {
            ...bankDetail,
            detail_url: '',
          },
        },
      },
    });

    try {
      // Step 2: Upload all files to storage in parallel (outside transaction to avoid timeout)
      const [
        vendorImageResult,
        panCardResult,
        adharCardResult,
        gstCertResult,
        orgCertResult,
        bankDetailResult,
      ] = await Promise.all([
        this.uploadFileAsync(files.vendor_image[0], `vendor/${vendor.id}/profile`),
        this.uploadFileAsync(
          files.pan_card[0],
          `vendor/${vendor.id}/documents/pan`,
        ),
        this.uploadFileAsync(
          files.adhar_card[0],
          `vendor/${vendor.id}/documents/adhar`,
        ),
        this.uploadFileAsync(
          files.gst_certification[0],
          `vendor/${vendor.id}/documents/gst`,
        ),
        this.uploadFileAsync(
          files.org_certification[0],
          `vendor/${vendor.id}/documents/org`,
        ),
        this.uploadFileAsync(
          files.bank_detail[0],
          `vendor/${vendor.id}/documents/bank`,
        ),
      ]);

      // Step 3: Update vendor with uploaded file URLs
      const entity = await this._prismaService.vendor.update({
        data: {
          vendor_image_url: vendorImageResult.url,
          pan_card_url: panCardResult.url,
          adhar_card_url: adharCardResult.url,
          gst_certificate_url: gstCertResult.url,
          org_certificate_url: orgCertResult.url,
          bank_detail: {
            update: {
              detail_url: bankDetailResult.url,
            },
          },
        },
        where: { id: vendor.id },
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

      // Step 4: Send OTP to vendor number
      await this._otpService.sendOtp(entity.number, OtpType.Number);

      return entity;
    } catch (error) {
      // Compensating action: delete the vendor if file upload or update fails
      await this._prismaService.vendor.delete({ where: { id: vendor.id } });
      throw error;
    }
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
      'bank_detail',
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
  private async uploadFileAsync(
    file: Express.Multer.File | Express.Multer.File[],
    folderPath: string,
  ) {
    // FileFieldsInterceptor returns arrays, extract the first file
    const singleFile = Array.isArray(file) ? file[0] : file;
    return this._storageService.uploadFileAsync({
      buffer: singleFile.buffer,
      originalName: singleFile.originalname,
      mimeType: singleFile.mimetype,
      size: singleFile.size,
      folderPath,
    });
  }
}
