import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSubServiceConditionDto {
  @ApiProperty({ description: 'Condition text', example: 'Must have working headlights' })
  @IsNotEmpty()
  @IsString()
  condition: string;
}
