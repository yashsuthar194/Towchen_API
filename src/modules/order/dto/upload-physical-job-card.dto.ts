import { ApiProperty } from '@nestjs/swagger';

export class UploadPhysicalJobCardDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file of the physical job card (JPG, JPEG, PNG)',
  })
  file: Express.Multer.File;
}
