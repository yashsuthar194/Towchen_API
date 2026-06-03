import { ApiProperty } from '@nestjs/swagger';

export class UploadOrderImagesDto {
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
