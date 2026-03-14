import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';
import { SignatureType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for submitting or updating a vendor's agreement.
 *
 * Sent as `multipart/form-data` because an optional signature file
 * can be attached alongside the JSON fields.
 *
 * @remarks
 * - `agreement_status` must be `true` to indicate the vendor accepts the terms.
 * - `signature_type` indicates whether the signature was uploaded as a file
 *   or drawn digitally.
 * - The optional signature file is handled by the controller's `FileInterceptor`,
 *   not by this DTO.
 *
 * @example
 * ```
 * PUT /vendor/agreement
 * Content-Type: multipart/form-data
 * Authorization: Bearer <jwt_token>
 *
 * representative_name: "John Doe"
 * representative_designation: "Manager"
 * signature_type: "Upload"
 * agreement_status: true
 * signature: [binary file]  (optional)
 * ```
 */
export class VendorAgreementDto {
  /** Full name of the authorised representative signing the agreement */
  @IsString()
  @IsNotEmpty({ message: 'representative_name is required' })
  representative_name: string;

  /** Designation / job title of the representative (e.g. "Director", "Manager") */
  @IsNotEmpty({ message: 'representative_designation is required' })
  @IsString()
  representative_designation: string;

  /**
   * How the signature was provided.
   * - `Upload` – the vendor uploaded a scanned signature image
   * - `Draw`   – the vendor drew the signature digitally
   */
  @IsEnum(SignatureType, {
    message: `signature_type must be one of: ${Object.values(SignatureType).join(', ')}`,
  })
  @ApiProperty({
    enum: SignatureType,
    example: SignatureType.Upload,
  })
  signature_type: SignatureType;

  /**
   * Whether the vendor accepts the agreement / terms of service.
   * Must be `true` to proceed.
   */
  @IsNotEmpty({ message: 'agreement_status is required' })
  @IsBoolean({ message: 'agreement_status must be a boolean' })
  @Transform(({ value }) => value === 'true' || value === true)
  @ApiProperty({ example: true })
  agreement_status: boolean;

  /** Optional signature document file (only for Swagger schema) */
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Signature document file (required when signature_type is Upload)',
  })
  signature?: any;
}
