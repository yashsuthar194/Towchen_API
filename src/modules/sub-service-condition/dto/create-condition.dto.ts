import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubServiceConditionDto {
  @ApiProperty({ description: 'ID of the sub-service', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  sub_service_id: number;

  @ApiProperty({ description: 'Condition text', example: 'Must have working headlights' })
  @IsNotEmpty()
  @IsString()
  condition: string;
}
