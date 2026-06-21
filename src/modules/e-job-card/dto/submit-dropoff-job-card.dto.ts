import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitDropoffJobCardDto {
  @ApiProperty({ description: "Handover's Name", example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  handover_name: string;

  @ApiProperty({ description: 'Drop Location', example: 'Workshop ABC' })
  @IsNotEmpty()
  @IsString()
  drop_location: string;

  @ApiProperty({ description: 'Droping Type', example: 'Authorized Workshop' })
  @IsNotEmpty()
  @IsString()
  droping_type: string;

  @ApiProperty({ description: 'Dropping (date & time)', example: '21/02/2025' })
  @IsNotEmpty()
  @IsString()
  dropping_date_and_time: string;

  @ApiProperty({ description: 'Remarks/comments', example: 'Delivered successfully.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Handover Image (File)' })
  handover_image: any;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Handover Signature (File)' })
  handover_signature: any;
}
