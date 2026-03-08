import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO defining the structure of uploaded files for vendor creation
 * Used with NestJS FileFieldsInterceptor for handling multiple file fields
 */
export class VendorUploadFilesPostDto {
  /** Vendor profile image file (JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  vendor_profile_image: Express.Multer.File;

  /** PAN Card document file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  pan_card: Express.Multer.File;

  /** Aadhaar Card document file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  aadhar_card: Express.Multer.File;

  /** GST Certificate document file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  gst_certificate: Express.Multer.File;

  /** Organization Certificate document file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  organization_certificate: Express.Multer.File;

  /** Passbook or Cancel Check file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  passbook_or_cancel_check: Express.Multer.File;

  /** Signature file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  signature: Express.Multer.File;
}
