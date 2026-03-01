import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO defining the structure of uploaded files for vendor creation
 * Used with NestJS FileFieldsInterceptor for handling multiple file fields
 */
export class VendorUploadFilesPostDto {
  /** Vendor profile image file (JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  vendor_image: Express.Multer.File;

  /** PAN Card document file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  pan_card: Express.Multer.File;

  /** Aadhaar Card document file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  adhar_card: Express.Multer.File;

  /** GST Certificate document file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  gst_certification: Express.Multer.File;

  /** Organization Certificate document file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  org_certification: Express.Multer.File;

  /** Bank detail file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  bank_detail: Express.Multer.File;

  /** Signature file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  signature_url: Express.Multer.File;
}
