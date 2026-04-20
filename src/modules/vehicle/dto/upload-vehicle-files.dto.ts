import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for vehicle image upload endpoints.
 *
 * Each endpoint accepts multiple images via multipart/form-data
 * with the field name `files`.
 */
export class UploadVehicleFilesDto {
  /** The files to upload */
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Vehicle documents (JPEG, PNG, or PDF)',
  })
  files: Express.Multer.File[];
}
