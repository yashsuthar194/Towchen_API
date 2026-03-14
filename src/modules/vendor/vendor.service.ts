import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { VendorListDto } from './dto/vendor-list.dto';
import { VendorDetailDto } from './dto/vendor-detail.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { VendorRegistrationResponseDto } from './dto/vendor-registration-response.dto';
import { StorageService } from 'src/services/storage/storage.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorAgreementDto } from './dto/vendor-agreement.dto';
import { Hash } from 'src/shared/helper/hash';
import { CallerService } from 'src/services/jwt/caller.service';
import { JwtService } from 'src/services/jwt/jwt.service';
import { SignatureType, Role } from '@prisma/client';

/**
 * Allowed document types for individual document upload.
 *
 * Each type maps to a storage sub-folder and a specific database column on
 * either the `vendor` table or the related `vendor_bank_detail` table.
 */
type VendorDocumentType =
  | 'profile'
  | 'pan'
  | 'aadhar'
  | 'gst'
  | 'org'
  | 'passbook'
  | 'signature';

/**
 * Service responsible for vendor CRUD, agreement management,
 * and document uploads.
 *
 * - File uploads are decoupled from create/update.
 * - Agreement (representative info + optional signature file) has its own flow.
 */
@Injectable()
export class VendorService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _storageService: StorageService,
    private readonly _callerService: CallerService,
    private readonly _jwtService: JwtService,
  ) {}

  // ────────────────────────────────────────────────────────
  //  Read
  // ────────────────────────────────────────────────────────

  /**
   * Retrieves a summary list of all active (non-deleted) vendors.
   *
   * @returns An array of vendor list DTOs sorted by ID ascending
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
        vendor_name: true,
        email: true,
        mobile_number: true,
        services: true,
        approved_by: true,
        status: true,
        created_at: true,
      },
    });
  }

  /**
   * Retrieves the full details of a specific vendor by their numeric ID.
   *
   * @param id - The vendor's unique numeric ID
   * @returns The vendor's complete profile including bank details and document URLs
   * @throws {NotFoundException} If no active vendor with the given ID exists
   */
  async getByIdAsync(id: number): Promise<VendorDetailDto> {
    return await this._prismaService.vendor.findFirstOrThrow({
      select: {
        id: true,
        formated_id: true,
        vendor_name: true,
        email: true,
        mobile_number: true,
        alternate_number: true,
        is_email_verified: true,
        vendor_profile_image_url: true,
        services: true,
        pan_card_url: true,
        aadhar_card_url: true,
        organization_name: true,
        organization_certificate_url: true,
        gst_number: true,
        gst_certificate_url: true,
        approved_by: true,
        status: true,
        created_at: true,
        updated_at: true,
        bank_detail: true,
        signature_url: true,
        is_gst_vendor: true,
      },
      where: {
        id,
        is_deleted: false,
      },
    });
  }

  /**
   * Retrieves the profile of the currently authenticated vendor.
   *
   * Uses CallerService to extract the vendor ID from the JWT token,
   * then delegates to `getByIdAsync`.
   *
   * @returns The authenticated vendor's complete profile
   * @throws {UnauthorizedException} If no auth token is present
   * @throws {NotFoundException} If the vendor record no longer exists
   */
  async getMyProfileAsync(): Promise<VendorDetailDto> {
    const userId = this._callerService.getUserId();
    return this.getByIdAsync(userId);
  }

  // ────────────────────────────────────────────────────────
  //  Create
  // ────────────────────────────────────────────────────────

  /**
   * Creates a new vendor account and returns JWT tokens.
   *
   * This is a pure data operation — no file handling.
   * Agreement and documents must be submitted separately after registration.
   *
   * @param dto - Vendor registration data (includes password + confirm_password)
   * @returns The newly created vendor's profile along with JWT tokens
   * @throws {BadRequestException} If passwords don't match or validation fails
   */
  async createAsync(
    dto: CreateVendorDto,
  ): Promise<VendorRegistrationResponseDto> {
    // Validate password confirmation
    if (dto.password !== dto.confirm_password) {
      throw new BadRequestException(
        'password and confirm_password do not match',
      );
    }

    const vendor = await this.createVendorRecord(dto);
    const vendorDetail = await this.getByIdAsync(vendor.id);

    // Generate JWT tokens so the vendor can authenticate immediately
    const tokens = await this._jwtService.generateTokens({
      id: vendor.id,
      email: vendor.email,
      type: Role.Vendor,
      is_email_verified: vendor.is_email_verified,
      is_number_verified: vendor.is_number_verified,
    });

    return {
      vendor: vendorDetail,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  /**
   * Creates the initial vendor and bank detail records in a single
   * Prisma transaction. File URL columns are initialised to empty strings
   * and filled later via the document upload endpoints.
   *
   * @param dto - Vendor creation data
   * @returns The raw vendor record (minimal, before enrichment)
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
        // Document URLs — filled via PUT /vendor/document/* endpoints
        vendor_profile_image_url: '',
        pan_card_url: '',
        aadhar_card_url: '',
        gst_certificate_url: '',
        organization_certificate_url: '',
        signature_url: '',
        // Agreement defaults — set via PUT /vendor/agreement
        agreement_status: false,
        representative_name: '',
        representative_designation: '',
        signature_type: SignatureType.Upload,
        bank_detail: {
          create: {
            ...bankDetail,
            passbook_or_cancel_check_url: '',
          },
        },
      },
    });
  }

  /**
   * Compensating action: removes the vendor and its bank detail record
   * when something fails after the initial database insert.
   *
   * @param vendorId - ID of the vendor to clean up
   */
  private async rollbackVendorCreation(vendorId: number): Promise<void> {
    await this._prismaService.vendor_bank_detail.delete({
      where: { vendor_id: vendorId },
    });
    await this._prismaService.vendor.delete({ where: { id: vendorId } });
  }

  // ────────────────────────────────────────────────────────
  //  Agreement
  // ────────────────────────────────────────────────────────

  /**
   * Submits or updates the vendor's agreement.
   *
   * Updates the four agreement fields on the vendor record and
   * optionally uploads a signature file. If `signature_type` is `Upload`
   * but no file is provided, a descriptive error is thrown.
   *
   * The vendor ID is obtained from the JWT via CallerService.
   *
   * @param dto - Agreement data (representative info, signature type, acceptance status)
   * @param signature - Optional signature document file
   * @returns The updated vendor profile
   * @throws {BadRequestException} If `signature_type` is `Upload` and no file is attached
   */
  async submitAgreementAsync(
    dto: VendorAgreementDto,
    signature?: Express.Multer.File,
  ): Promise<VendorDetailDto> {
    const vendorId = this._callerService.getUserId();

    // Validate: if signature_type is Upload, a file must be provided
    if (dto.signature_type === SignatureType.Upload && !signature) {
      throw new BadRequestException(
        'Signature file is required when signature_type is "Upload". ' +
          'Attach it as the "signature" field in multipart/form-data.',
      );
    }

    // Upload signature file if provided
    let signatureUrl: string | undefined;
    if (signature) {
      const result = await this.uploadFileAsync(
        signature,
        `vendor/${vendorId}/documents/signature`,
      );
      signatureUrl = result.url;
    }

    // Update agreement fields (and signature URL if uploaded)
    await this._prismaService.vendor.update({
      where: { id: vendorId },
      data: {
        representative_name: dto.representative_name,
        representative_designation: dto.representative_designation,
        signature_type: dto.signature_type,
        agreement_status: dto.agreement_status,
        ...(signatureUrl && { signature_url: signatureUrl }),
      },
    });

    return this.getByIdAsync(vendorId);
  }

  // ────────────────────────────────────────────────────────
  //  Update
  // ────────────────────────────────────────────────────────

  /**
   * Updates a vendor's profile and bank details with a plain JSON payload.
   *
   * Does NOT handle file uploads. Document changes are made through
   * the individual `PUT /vendor/document/*` endpoints.
   *
   * @param dto - Updated vendor profile data
   * @param id - The vendor's unique numeric ID
   * @returns The updated vendor profile
   * @throws {NotFoundException} If no vendor with the given ID exists
   * @throws {BadRequestException} If validation fails
   */
  async updateAsync(
    dto: UpdateVendorDto,
    id: number,
  ): Promise<VendorDetailDto> {
    const vendorData = UpdateVendorDto.toVendorData(dto);
    const bankDetail = UpdateVendorDto.toBankDetail(dto);

    return await this._prismaService.vendor.update({
      data: {
        ...vendorData,
        bank_detail: {
          update: {
            ...bankDetail,
          },
        },
      },
      where: { id },
      select: {
        id: true,
        formated_id: true,
        vendor_name: true,
        email: true,
        mobile_number: true,
        alternate_number: true,
        is_email_verified: true,
        vendor_profile_image_url: true,
        services: true,
        pan_card_url: true,
        aadhar_card_url: true,
        organization_name: true,
        organization_certificate_url: true,
        gst_number: true,
        gst_certificate_url: true,
        approved_by: true,
        status: true,
        created_at: true,
        updated_at: true,
        bank_detail: true,
        is_gst_vendor: true,
      },
    });
  }

  // ────────────────────────────────────────────────────────
  //  Delete
  // ────────────────────────────────────────────────────────

  /**
   * Soft-deletes a vendor by setting `is_deleted = true`.
   *
   * @param id - The vendor's unique numeric ID
   * @throws {NotFoundException} If no vendor with the given ID exists
   */
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

  // ────────────────────────────────────────────────────────
  //  Document Upload
  // ────────────────────────────────────────────────────────

  /**
   * Uploads (or replaces) a single vendor document.
   *
   * The vendor ID is obtained from the JWT token via CallerService.
   * The file is uploaded to a type-specific storage folder and the
   * corresponding URL column in the database is updated.
   *
   * For the "passbook" type, the URL is stored on the related
   * `vendor_bank_detail` record rather than on the vendor record itself.
   *
   * @param documentType - Which document to upload (profile, pan, aadhar, gst, org, passbook)
   * @param file - The uploaded file
   * @returns An object containing the public URL of the uploaded file
   * @throws {UnauthorizedException} If the caller is not authenticated
   * @throws {BadRequestException} If the vendor has no bank detail record (passbook only)
   */
  async uploadDocumentAsync(
    documentType: VendorDocumentType,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const vendorId = this._callerService.getUserId();

    // For the passbook upload, verify that a bank detail record exists
    if (documentType === 'passbook') {
      const bankDetail =
        await this._prismaService.vendor_bank_detail.findUnique({
          where: { vendor_id: vendorId },
        });
      if (!bankDetail) {
        throw new BadRequestException(
          'Cannot upload passbook: no bank detail record found for this vendor. ' +
            'Ensure the vendor was created with bank details.',
        );
      }
    }

    const folderPath = `vendor/${vendorId}/documents/${documentType}`;
    const result = await this.uploadFileAsync(file, folderPath);

    const updateData = this.buildDocumentUpdateData(documentType, result.url);
    await this._prismaService.vendor.update({
      where: { id: vendorId },
      data: updateData,
    });

    return { url: result.url };
  }

  /**
   * Maps a document type to the Prisma update payload that sets
   * the correct URL column.
   *
   * @param type - The document type identifier
   * @param url - The uploaded file's public URL
   * @returns A Prisma-compatible update data object
   */
  private buildDocumentUpdateData(
    type: VendorDocumentType,
    url: string,
  ): Record<string, any> {
    const mapping: Record<VendorDocumentType, Record<string, any>> = {
      profile: { vendor_profile_image_url: url },
      pan: { pan_card_url: url },
      aadhar: { aadhar_card_url: url },
      gst: { gst_certificate_url: url },
      org: { organization_certificate_url: url },
      passbook: {
        bank_detail: { update: { passbook_or_cancel_check_url: url } },
      },
      signature: { signature_url: url },
    };

    return mapping[type];
  }

  // ────────────────────────────────────────────────────────
  //  File Helpers
  // ────────────────────────────────────────────────────────

  /**
   * Uploads a single file to the configured cloud storage.
   *
   * @param file - The Multer file object (may be a single file or an array from interceptors)
   * @param folderPath - The destination folder path in the storage bucket
   * @returns The upload result containing at least the public URL
   */
  private async uploadFileAsync(
    file: Express.Multer.File | Express.Multer.File[],
    folderPath: string,
  ) {
    // FileInterceptor may return an array in edge cases; normalise to a single file
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
