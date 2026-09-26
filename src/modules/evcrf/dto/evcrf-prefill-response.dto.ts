import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvcrfPrefillItemDto } from './evcrf-prefill-item.dto';

export class EvcrfPrefillResponseDto {
  @ApiProperty({ description: 'Job card type', example: 'EVCRF', enum: ['EVCRF'] })
  job_card_type: string;

  @ApiProperty({ description: 'Array of prefill details', type: [EvcrfPrefillItemDto] })
  prefill_details: EvcrfPrefillItemDto[];
}

export class DropoffEvcrfPrefillResponseDto {
  @ApiProperty({ description: 'Job card type', example: 'EVCRF', enum: ['EVCRF'] })
  job_card_type: string;

  @ApiProperty({ description: 'Array of prefill details', type: [EvcrfPrefillItemDto] })
  prefill_details: EvcrfPrefillItemDto[];
}

