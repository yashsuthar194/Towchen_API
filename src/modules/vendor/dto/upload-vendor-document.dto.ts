import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for individual vendor document upload endpoints.
 *
 * Used by all `PUT /vendor/document/*` endpoints.
 * Each endpoint accepts a single file via multipart/form-data
 * with the field name `file`.
 *
 * @example
 * ```
 * PUT /vendor/document/pan-card
 * Content-Type: multipart/form-data
 * Authorization: Bearer <jwt_token>
 *
 * file: [binary]
 * ```
 */
export class UploadVendorDocumentDto {
  /** The document file to upload (PDF, JPEG, or PNG) */
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Document file (PDF, JPEG, or PNG)',
  })
  file: Express.Multer.File;
}
