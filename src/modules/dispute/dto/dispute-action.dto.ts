import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DisputeActionDto {
  @ApiPropertyOptional({
    description: 'Remarks or justification for the approval / finalization action',
    example: 'Approved dispute based on verified receipt and route tracking.',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
