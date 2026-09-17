import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, IsArray, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateLeadDto {
  @ApiProperty({ description: 'ID of the driver assigned', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  driver_id: number;

  @ApiProperty({ description: 'ID of the sub-service', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  sub_service_id: number;

  @ApiProperty({ description: 'Lead amount', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  lead_amount: number;



  @ApiProperty({ description: 'Start location place_id', example: 'ChIJxT1...place_id' })
  @IsNotEmpty()
  @IsString()
  start_location: string;

  @ApiProperty({ description: 'End location place_id', example: 'ChIJ...place_id' })
  @IsNotEmpty()
  @IsString()
  end_location: string;

  @ApiPropertyOptional({ description: 'List of intermediate tag locations (full addresses)', type: [String], example: ['789 Ring Rd, Gandhinagar, Gujarat 382010'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tag_locations?: string[];

  @ApiProperty({ description: 'Distance string', example: '140 Km' })
  @IsNotEmpty()
  @IsString()
  distance: string;

  @ApiProperty({ description: 'Time string', example: '10 Hr 40 Mins' })
  @IsNotEmpty()
  @IsString()
  time: string;
}
