import { ApiPropertyOptional } from '@nestjs/swagger';

export class DriverUploadFilesPutDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Update Driver Adhar Card document',
  })
  aadhar_card?: Express.Multer.File[];

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Update Driver PAN Card document',
  })
  pan_card?: Express.Multer.File[];

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Update Driver License document',
  })
  driver_license?: Express.Multer.File[];

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Update Driver Profile Image',
  })
  driver_image?: Express.Multer.File[];
}
