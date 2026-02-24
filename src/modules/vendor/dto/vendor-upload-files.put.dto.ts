import { ApiPropertyOptional } from '@nestjs/swagger';

export class VendorUploadFilesPutDto {
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

  /** Bacnk detail file (PDF, JPEG, PNG) */
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  bank_detail: Express.Multer.File;
}
