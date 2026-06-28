import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConditionGroupDto {
  @ApiProperty({ description: 'The configuration ID this group belongs to', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  vehicle_class_configuration_id: number;

  @ApiProperty({ description: 'Name of the condition group', example: 'Weather' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'List of options for this group', example: ['Wet', 'Dry'] })
  @IsArray()
  @IsString({ each: true })
  options: string[];
}

export class UpdateConditionGroupDto {
  @ApiProperty({ description: 'Name of the condition group', example: 'Weather', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'List of options for this group', example: ['Wet', 'Dry'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}
