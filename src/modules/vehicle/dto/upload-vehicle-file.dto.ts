import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for single vehicle document upload endpoints.
 *
 * This DTO is used when an endpoint receives exactly one file
 * via multipart/form-data with the field name `file`.
 */
export class UploadVehicleFileDto {
  /** The file to upload */
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Vehicle document (PDF, DOC, DOCX)',
  })
  file: Express.Multer.File;
}
