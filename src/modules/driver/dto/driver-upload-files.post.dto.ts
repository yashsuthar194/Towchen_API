import { ApiProperty } from '@nestjs/swagger';

export class DriverUploadFilesPostDto {
  /*
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Driver profile image',
    })
    profile_image: Express.Multer.File[];
    */

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Driver Adhar Card document',
  })
  aadhar_card: Express.Multer.File[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Driver PAN Card document',
  })
  pan_card: Express.Multer.File[];

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Driver License document',
  })
  driver_license: Express.Multer.File[];
}
