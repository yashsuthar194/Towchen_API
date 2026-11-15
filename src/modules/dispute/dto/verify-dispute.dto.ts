import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VerifyDisputeDto {
  @ApiPropertyOptional({
    description:
      'Adjusted or verified amount approved by the Administrator. If omitted, retains current value or demanded amount.',
    example: 350.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  approved_amount?: number;

  @ApiPropertyOptional({
    description: 'Verification notes or justification for amount adjustment',
    example: 'Toll slip verified. Actual payable toll is ₹350, adjusted down from ₹500 demanded.',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
