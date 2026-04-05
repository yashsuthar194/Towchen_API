import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { VendorListDto } from './dto/vendor-list.dto';
import { VendorDetailDto } from './dto/vendor-detail.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorAgreementDto } from './dto/vendor-agreement.dto';
import { VendorRegistrationResponseDto } from './dto/vendor-registration-response.dto';
import { UploadVendorDocumentDto } from './dto/upload-vendor-document.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import {
  ApiResponseDto,
  ApiResponseDtoNull,
} from 'src/core/response/decorators/api-response-dto.decorator';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';

/**
 * Controller for vendor CRUD operations, agreement management,
 * and document uploads.
 *
 * - **Registration & Update**: Pure JSON endpoints.
 * - **Agreement**: `PUT /vendor/agreement` — JWT-guarded, multipart/form-data
 *   (4 fields + optional signature file).
 * - **Documents**: `PUT /vendor/document/*` — JWT-guarded, single file each.
 *
 * @remarks
 * Static routes (profile, list, agreement, document/*) are defined
 * BEFORE parameterized routes (:id) so NestJS matches them correctly.
 */
@Controller('vendor')
export class VendorController {
  constructor(private readonly _vendorService: VendorService) {}

  /**
   * Retrieves the currently authenticated vendor's own profile.
   *
   * The vendor ID is extracted automatically from the JWT token,
   * so no ID parameter is needed.
   *
   * @returns The authenticated vendor's complete profile
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {NotFoundException} If the vendor record no longer exists
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponseDto(VendorDetailDto)
  @Get('profile')
  async getProfile(): Promise<ResponseDto<VendorDetailDto>> {
    const vendor = await this._vendorService.getMyProfileAsync();
    return ResponseDto.retrieved('Profile retrieved successfully', vendor);
  }

  /**
   * Retrieves a list of all active (non-deleted) vendors with basic
   * information such as name, email, services, and status.
   *
   * @returns An array of vendor summaries
   */
  @Get('list')
  @ApiResponseDto(VendorListDto, true, 200)
  async getListAsync(): Promise<ResponseDto<VendorListDto[]>> {
    const vendors = await this._vendorService.getListAsync();
    return ResponseDto.retrieved('Vendors retrieved successfully', vendors);
  }

  /**
   * Creates a new vendor account.
   *
   * Accepts a plain JSON body with vendor profile, bank details,
   * and password + confirm_password. Returns the created vendor's
   * profile along with JWT tokens for immediate authentication.
   *
   * @param dto - Vendor registration data (personal info, bank details, passwords)
   * @returns The created vendor's profile and JWT tokens
   * @throws {BadRequestException} If passwords don't match or validation fails
   */
  @Post()
  @ApiResponseDto(VendorRegistrationResponseDto, false, 201)
  async createAsync(
    @Body() dto: CreateVendorDto,
  ): Promise<ResponseDto<VendorRegistrationResponseDto>> {
    const result = await this._vendorService.createAsync(dto);
    return ResponseDto.created('Vendor created successfully', result);
  }

  /**
   * Submits or updates the vendor's agreement details.
   *
   * Accepts `multipart/form-data` with 4 JSON fields and an optional
   * signature file. If the vendor has already submitted an agreement,
   * calling this endpoint again will update the existing values.
   *
   * @param dto - Agreement data (representative info, signature type, acceptance status)
   * @param signature - Optional signature document file (required when `signature_type` is `Upload`)
   * @returns The updated vendor profile
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {BadRequestException} If `signature_type` is `Upload` but no file is provided
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @Put('agreement')
  @ApiConsumes('multipart/form-data')
  @ApiResponseDto(VendorDetailDto, false, 200)
  @UseInterceptors(FileInterceptor('signature'))
  async submitAgreement(
    @Body() dto: VendorAgreementDto,
    @UploadedFile() signature?: Express.Multer.File,
  ): Promise<ResponseDto<VendorDetailDto>> {
    const vendor = await this._vendorService.submitAgreementAsync(
      dto,
      signature,
    );
    return ResponseDto.updated('Agreement submitted successfully', vendor);
  }

  /**
   * Uploads or replaces the vendor's profile image.
   *
   * @param file - Image file (JPEG, PNG)
   * @returns The public URL of the uploaded profile image
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {BadRequestException} If no file is provided
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVendorDocumentDto })
  @Put('document/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'Profile image');
    const result = await this._vendorService.uploadDocumentAsync(
      'profile',
      file,
    );
    return ResponseDto.updated('Profile image uploaded successfully', result);
  }

  /**
   * Uploads or replaces the vendor's PAN card document.
   *
   * @param file - PAN card file (PDF, JPEG, PNG)
   * @returns The public URL of the uploaded PAN card
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {BadRequestException} If no file is provided
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVendorDocumentDto })
  @Put('document/pan-card')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPanCard(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'PAN card');
    const result = await this._vendorService.uploadDocumentAsync('pan', file);
    return ResponseDto.updated('PAN card uploaded successfully', result);
  }

  /**
   * Uploads or replaces the vendor's Aadhaar card document.
   *
   * @param file - Aadhaar card file (PDF, JPEG, PNG)
   * @returns The public URL of the uploaded Aadhaar card
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {BadRequestException} If no file is provided
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVendorDocumentDto })
  @Put('document/aadhar-card')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAadharCard(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'Aadhaar card');
    const result = await this._vendorService.uploadDocumentAsync(
      'aadhar',
      file,
    );
    return ResponseDto.updated('Aadhaar card uploaded successfully', result);
  }

  /**
   * Uploads or replaces the vendor's GST certificate document.
   *
   * @param file - GST certificate file (PDF, JPEG, PNG)
   * @returns The public URL of the uploaded GST certificate
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {BadRequestException} If no file is provided
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVendorDocumentDto })
  @Put('document/gst-certificate')
  @UseInterceptors(FileInterceptor('file'))
  async uploadGstCertificate(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'GST certificate');
    const result = await this._vendorService.uploadDocumentAsync('gst', file);
    return ResponseDto.updated('GST certificate uploaded successfully', result);
  }

  /**
   * Uploads or replaces the vendor's organization certificate document.
   *
   * @param file - Organization certificate file (PDF, JPEG, PNG)
   * @returns The public URL of the uploaded organization certificate
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {BadRequestException} If no file is provided
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVendorDocumentDto })
  @Put('document/organization-certificate')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOrganizationCertificate(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'Organization certificate');
    const result = await this._vendorService.uploadDocumentAsync('org', file);
    return ResponseDto.updated(
      'Organization certificate uploaded successfully',
      result,
    );
  }

  /**
   * Uploads or replaces the vendor's bank passbook or cancelled cheque document.
   *
   * This document is stored on the vendor's associated bank detail record,
   * not directly on the vendor record.
   *
   * @param file - Passbook or cancelled cheque file (PDF, JPEG, PNG)
   * @returns The public URL of the uploaded document
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {BadRequestException} If no file is provided or if no bank detail record exists
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVendorDocumentDto })
  @Put('document/passbook')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPassbook(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'Passbook / cancelled cheque');
    const result = await this._vendorService.uploadDocumentAsync(
      'passbook',
      file,
    );
    return ResponseDto.updated(
      'Passbook / cancelled cheque uploaded successfully',
      result,
    );
  }

  /**
   * Uploads or replaces the vendor's signature document.
   *
   * This can also be uploaded as part of the agreement submission
   * via `PUT /vendor/agreement`, but this endpoint allows the vendor
   * to update the signature independently.
   *
   * @param file - Signature file (PDF, JPEG, PNG)
   * @returns The public URL of the uploaded signature
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {BadRequestException} If no file is provided
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadVendorDocumentDto })
  @Put('document/signature')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSignature(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    this.ensureFileProvided(file, 'Signature');
    const result = await this._vendorService.uploadDocumentAsync(
      'signature',
      file,
    );
    return ResponseDto.updated('Signature uploaded successfully', result);
  }

  /**
   * Retrieves full details for a specific vendor, including bank details,
   * all document URLs, and approval status.
   *
   * @param id - The vendor's unique numeric ID
   * @returns The vendor's complete profile
   * @throws {NotFoundException} If no vendor with the given ID exists or is soft-deleted
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
   * Updates an existing vendor's profile and bank details.
   *
   * This endpoint accepts a plain JSON body — no file uploads.
   * To update documents, use the individual `PUT /vendor/document/*` endpoints.
   *
   * @param id - The vendor's unique numeric ID
   * @param dto - Updated vendor data
   * @returns The updated vendor profile
   * @throws {NotFoundException} If no vendor with the given ID exists
   * @throws {BadRequestException} If validation fails
   */
  @Put(':id')
  @ApiResponseDto(VendorDetailDto, false, 200)
  async updateAsync(
    @Param('id') id: number,
    @Body() dto: UpdateVendorDto,
  ): Promise<ResponseDto<VendorDetailDto>> {
    const vendor = await this._vendorService.updateAsync(dto, id);
    return ResponseDto.updated('Vendor updated successfully', vendor);
  }

  /**
   * Allows the currently authenticated vendor to delete their own account.
   *
   * The vendor ID is extracted from the JWT token — no ID parameter is needed.
   * The record is soft-deleted (`is_deleted = true`) and retained for audit purposes.
   *
   * @returns A success response confirming the account was deleted
   * @throws {UnauthorizedException} If the JWT token is missing or invalid
   * @throws {ForbiddenException} If the authenticated user is not a vendor
   * @throws {NotFoundException} If the vendor record no longer exists
   */
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponseDtoNull(200)
  @Delete('me')
  async deleteMyAccountAsync(): Promise<ResponseDto<null>> {
    await this._vendorService.deleteMyAccountAsync();
    return ResponseDto.deleted('Account deleted successfully');
  }

  /**
   * Soft-deletes a vendor by marking them as deleted.
   * The vendor record is retained in the database for audit purposes.
   *
   * @param id - The vendor's unique numeric ID
   * @throws {NotFoundException} If no vendor with the given ID exists
   */
  @Delete(':id')
  @ApiResponseDtoNull(200)
  async deleteAsync(@Param('id') id: number): Promise<ResponseDto<null>> {
    await this._vendorService.deleteAsync(id);
    return ResponseDto.deleted('Vendor deleted successfully');
  }

  /**
   * Validates that a file was actually included in the multipart request.
   *
   * @param file - The file extracted by the interceptor (may be undefined)
   * @param label - Human-readable name of the expected document (used in error message)
   * @throws {BadRequestException} If the file is falsy
   */
  private ensureFileProvided(
    file: Express.Multer.File | undefined,
    label: string,
  ): void {
    if (!file) {
      throw new BadRequestException(
        `${label} file is required. Send it as the "file" field in multipart/form-data.`,
      );
    }
  }
}
