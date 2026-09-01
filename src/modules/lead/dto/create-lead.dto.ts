import { IsNotEmpty, IsNumber, IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadDispatchType } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ description: 'ID of the vehicle assigned', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  vehicle_id: number;

  @ApiProperty({ description: 'ID of the sub-service', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  sub_service_id: number;

  @ApiProperty({ description: 'Type of dispatch', enum: LeadDispatchType, example: LeadDispatchType.Current })
  @IsNotEmpty()
  @IsEnum(LeadDispatchType)
  dispatch_type: LeadDispatchType;

  @ApiPropertyOptional({ description: 'Activation time if scheduled' })
  @IsOptional()
  @IsString()
  activation_time?: string;

  @ApiProperty({ description: 'Start location full address', example: '123 Main St, Ahmedabad, Gujarat 380001' })
  @IsNotEmpty()
  @IsString()
  start_location: string;

  @ApiProperty({ description: 'End location full address', example: '456 Highway, Himmatnagar, Gujarat 383001' })
  @IsNotEmpty()
  @IsString()
  end_location: string;

  @ApiPropertyOptional({ description: 'List of intermediate tag locations (full addresses)', type: [String], example: ['789 Ring Rd, Gandhinagar, Gujarat 382010'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tag_locations?: string[];

  @ApiPropertyOptional({ description: 'Distance string', example: '140 Km' })
  @IsOptional()
  @IsString()
  distance?: string;

  @ApiPropertyOptional({ description: 'Time string', example: '10 Hr 40 Mins' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty({ description: 'Computed lead amount', example: 1950.00 })
  @IsNotEmpty()
  @IsNumber()
  lead_amount: number;
}
