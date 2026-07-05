import { ApiProperty } from '@nestjs/swagger';
import { JobCardPrefillItemDto } from './job-card-prefill-item.dto';

export class JobCardPrefillResponseDto {
  @ApiProperty({ description: 'Array of prefill details', type: [JobCardPrefillItemDto] })
  prefill_details: JobCardPrefillItemDto[];
}
