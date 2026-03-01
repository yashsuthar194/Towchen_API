import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { VendorListDto } from './dto/vendor-list.dto';
import { VendorDetailDto } from './dto/vendor-detail.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { StorageService } from 'src/services/storage/storage.service';
import { VendorUploadFilesPostDto } from './dto/vendor-upload-files.post.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorUploadFilesPutDto } from './dto/vendor-upload-files.put.dto';
import { OtpService } from '../otp/otp.service';
import { Hash } from 'src/shared/helper/hash';
import { CallerService } from 'src/services/jwt/caller.service';

@Injectable()
export class VendorService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _storageService: StorageService,
    private readonly _otpService: OtpService,
    private readonly _callerService: CallerService,
  ) { }

  // #region Get
  /**
   * Get list data
   * @returns
   */
  async getListAsync(): Promise<VendorListDto[]> {
    return await this._prismaService.vendor.findMany({
      where: {
        is_deleted: false,
      },
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
        is_deleted: false,
      },
    });
  }

  /**
   * Get the current authenticated vendor's profile
   * Uses CallerService to automatically get the current user's ID from JWT token
   *
   * @returns Promise resolving to the authenticated vendor's profile
   * @throws {UnauthorizedException} If no authentication token is present
   * @throws {NotFoundException} If vendor is not found
   *
   * @example
   * This method automatically extracts the user ID from the JWT token:
   * ```typescript
   * // In controller - no need to pass user ID
   * @UseGuards(JwtAuthGuard)
   * @Get('profile')
   * async getProfile() {
   *   return this.vendorService.getMyProfileAsync();
   * }
   * ```
   */
  async getMyProfileAsync(): Promise<VendorDetailDto> {
    const userId = this._callerService.getUserId();
    return this.getByIdAsync(userId);
  }
  // #endregion

  // #region Create
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
    files: VendorUploadFilesPostDto,
  ): Promise<VendorDetailDto> {
    this.validateRequiredFiles(files);

    const vendor = await this.createVendorRecord(dto);

    try {
      const fileUrls = await this.uploadVendorFiles(vendor.id, files);
      return await this.updateVendorWithFileUrls(vendor.id, fileUrls);
    } catch (error) {
      await this.rollbackVendorCreation(vendor.id);
      throw error;
    }
  }

  /**
   * Creates the initial vendor and bank detail records with empty file URLs
   * @private
   */
  private async createVendorRecord(dto: CreateVendorDto) {
    const vendorData = CreateVendorDto.toVendorData(dto);

    vendorData.password = await Hash.hashAsync(dto.password);

    const bankDetail = CreateVendorDto.toBankDetail(dto);

    return this._prismaService.vendor.create({
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
  }

  /**
   * Updates vendor record with uploaded file URLs
   * @private
   */
  private async updateVendorWithFileUrls(
    vendorId: number,
    fileUrls: {
      vendor_image_url: string;
      pan_card_url: string;
      adhar_card_url: string;
      gst_certificate_url: string;
      org_certificate_url: string;
      bank_detail_url: string;
    },
  ): Promise<VendorDetailDto> {
    return this._prismaService.vendor.update({
      data: {
        vendor_image_url: fileUrls.vendor_image_url,
        pan_card_url: fileUrls.pan_card_url,
        adhar_card_url: fileUrls.adhar_card_url,
        gst_certificate_url: fileUrls.gst_certificate_url,
        org_certificate_url: fileUrls.org_certificate_url,
        bank_detail: {
          update: {
            detail_url: fileUrls.bank_detail_url,
          },
        },
      },
      where: { id: vendorId },
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
   * Compensating action: removes vendor and bank detail on failure
   * @private
   */
  private async rollbackVendorCreation(vendorId: number): Promise<void> {
    await this._prismaService.vendor_bank_detail.delete({
      where: { vendor_id: vendorId },
    });
    await this._prismaService.vendor.delete({ where: { id: vendorId } });
  }
  //#endregion

  //#region Update
  async updateAsync(
    dto: UpdateVendorDto,
    files: VendorUploadFilesPutDto,
    id: number,
  ): Promise<VendorDetailDto> {
    const { bank_detail_url, ...updatedFiles } = await this.updateVendorFiles(
      id,
      files,
    );

    const vendorData = UpdateVendorDto.toVendorData(dto);
    const bankDetail = UpdateVendorDto.toBankDetail(dto);

    return await this._prismaService.vendor.update({
      data: {
        ...vendorData,
        bank_detail: {
          update: {
            ...bankDetail,
            detail_url: bank_detail_url,
          },
        },
        ...updatedFiles,
      },
      where: { id },
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
  //#endregion

  //#region Delete
  async deleteAsync(id: number) {
    await this._prismaService.vendor.findUniqueOrThrow({
      where: { id },
    });
    await this._prismaService.vendor.update({
      where: { id },
      data: {
        is_deleted: true,
      },
    });
  }
  //#endregion

  // #region Files
  private async updateVendorFiles(
    vendorId: number,
    files: VendorUploadFilesPutDto,
  ) {
    const [
      vendorImageResult,
      panCardResult,
      adharCardResult,
      gstCertResult,
      orgCertResult,
      bankDetailResult,
    ] = await Promise.all([
      this.updateFileAsync(
        files.vendor_image?.[0],
        `vendor/${vendorId}/profile`,
      ),
      this.updateFileAsync(
        files.pan_card?.[0],
        `vendor/${vendorId}/documents/pan`,
      ),
      this.updateFileAsync(
        files.adhar_card?.[0],
        `vendor/${vendorId}/documents/adhar`,
      ),
      this.updateFileAsync(
        files.gst_certification?.[0],
        `vendor/${vendorId}/documents/gst`,
      ),
      this.updateFileAsync(
        files.org_certification?.[0],
        `vendor/${vendorId}/documents/org`,
      ),
      this.updateFileAsync(
        files.bank_detail?.[0],
        `vendor/${vendorId}/documents/bank`,
      ),
    ]);

    return {
      vendor_image_url: vendorImageResult?.url || undefined,
      pan_card_url: panCardResult?.url || undefined,
      adhar_card_url: adharCardResult?.url || undefined,
      gst_certificate_url: gstCertResult?.url || undefined,
      org_certificate_url: orgCertResult?.url || undefined,
      bank_detail_url: bankDetailResult?.url || undefined,
    };
  }

  /**
   * Uploads all vendor files to storage in parallel
   * @private
   */
  private async uploadVendorFiles(
    vendorId: number,
    files: VendorUploadFilesPostDto,
  ) {
    const [
      vendorImageResult,
      panCardResult,
      adharCardResult,
      gstCertResult,
      orgCertResult,
      bankDetailResult,
    ] = await Promise.all([
      this.uploadFileAsync(files.vendor_image[0], `vendor/${vendorId}/profile`),
      this.uploadFileAsync(
        files.pan_card[0],
        `vendor/${vendorId}/documents/pan`,
      ),
      this.uploadFileAsync(
        files.adhar_card[0],
        `vendor/${vendorId}/documents/adhar`,
      ),
      this.uploadFileAsync(
        files.gst_certification[0],
        `vendor/${vendorId}/documents/gst`,
      ),
      this.uploadFileAsync(
        files.org_certification[0],
        `vendor/${vendorId}/documents/org`,
      ),
      this.uploadFileAsync(
        files.bank_detail[0],
        `vendor/${vendorId}/documents/bank`,
      ),
    ]);

    return {
      vendor_image_url: vendorImageResult.url,
      pan_card_url: panCardResult.url,
      adhar_card_url: adharCardResult.url,
      gst_certificate_url: gstCertResult.url,
      org_certificate_url: orgCertResult.url,
      bank_detail_url: bankDetailResult.url,
    };
  }

  /**
   * Validates that all required files are present
   *
   * @param files - Uploaded files object
   * @throws {BadRequestException} If any required file is missing
   * @private
   */
  private validateRequiredFiles(files: VendorUploadFilesPostDto): void {
    const requiredFiles: (keyof VendorUploadFilesPostDto)[] = [
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

  /**
   * Updates a single file in storage
   *
   * @param file - Multer file object
   * @param folderPath - Destination folder path in storage
   * @returns Promise resolving to file upload result or null if no file is provided
   */
  private async updateFileAsync(
    file: Express.Multer.File | Express.Multer.File[],
    folderPath: string,
  ) {
    // FileFieldsInterceptor returns arrays, extract the first file
    const singleFile = Array.isArray(file) ? file?.[0] : file;

    if (!singleFile) return null;

    return this._storageService.uploadFileAsync({
      buffer: singleFile.buffer,
      originalName: singleFile.originalname,
      mimeType: singleFile.mimetype,
      size: singleFile.size,
      folderPath,
    });
  }
  // #endregion
}
