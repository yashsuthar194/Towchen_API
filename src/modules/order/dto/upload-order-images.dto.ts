import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for order image upload endpoints.
 *
 * Each endpoint accepts multiple images via multipart/form-data
 * with the field name `files`.
 */
export class UploadOrderImagesDto {
  /** The files to upload */
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Order images (JPG, JPEG, PNG)',
  })
  files: Express.Multer.File[];
}
