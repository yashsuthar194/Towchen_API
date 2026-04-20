import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for driver profile image upload endpoint.
 */
export class UploadDriverImageDto {
  /** The image file to upload (JPG, JPEG, or PNG) */
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile image file (JPG, JPEG, or PNG)',
  })
  file: Express.Multer.File;
}
