import { ApiProperty } from '@nestjs/swagger';

export class UploadPhysicalVcrfDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file of the physical VCRF (JPG, JPEG, PNG)',
  })
  file: Express.Multer.File;
}
