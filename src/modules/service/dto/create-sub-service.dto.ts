import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubServiceDto {
  @ApiProperty({ description: 'Name of the sub-service', example: 'Flatbed Towing' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'ID of the parent service', example: 1 })
  @IsNotEmpty()
  @IsInt()
  service_id: number;
}
