import { IsNotEmpty, IsString, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubServiceDto {
  @ApiProperty({ description: 'Name of the sub-service', example: 'Flatbed Towing' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'ID of the parent service', example: 1 })
  @IsNotEmpty()
  @IsInt()
  service_id: number;

  @ApiProperty({ description: 'Fixed distance for the base price', example: 5, default: 0 })
  @IsNumber()
  @Min(0)
  fix_distance: number;

  @ApiProperty({ description: 'Fixed price for the base distance', example: 100, default: 0 })
  @IsNumber()
  @Min(0)
  fix_price: number;

  @ApiProperty({ description: 'Extra price per unit distance beyond fixed distance', example: 20, default: 0 })
  @IsNumber()
  @Min(0)
  extra_price: number;

  @ApiProperty({ description: 'Weight capacity in tons', example: 1.5, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ton?: number;
}
