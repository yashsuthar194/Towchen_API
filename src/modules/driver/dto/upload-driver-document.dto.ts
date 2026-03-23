import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for individual driver document upload endpoints.
 *
 * Each endpoint accepts a single file via multipart/form-data
 * with the field name `file`.
 */
export class UploadDriverDocumentDto {
  /** The document file to upload (PDF, JPEG, or PNG) */
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Document file (PDF, JPEG, or PNG)',
  })
  file: Express.Multer.File;
}
