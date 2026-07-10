import { ApiProperty } from '@nestjs/swagger';
import { EvcrfPrefillItemDto } from './evcrf-prefill-item.dto';

export class EvcrfPrefillResponseDto {
  @ApiProperty({ description: 'Array of prefill details', type: [EvcrfPrefillItemDto] })
  prefill_details: EvcrfPrefillItemDto[];
}
