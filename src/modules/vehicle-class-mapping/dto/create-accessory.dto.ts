import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccessoryDto {
  @ApiProperty({ description: 'The configuration ID this accessory belongs to', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  vehicle_class_configuration_id: number;

  @ApiProperty({ description: 'The name of the accessory', example: 'Tool kit' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
