import { ApiProperty } from '@nestjs/swagger';
import { JobCardPrefillItemDto } from './job-card-prefill-item.dto';

export class JobCardConfigResponseDto {
  @ApiProperty({ description: 'The mapped vehicle class', example: 'Car' })
  mapped_class: string;

  @ApiProperty({ description: 'Diagram image URL' })
  diagram_image_url: string;

  @ApiProperty({ description: 'Total damage points', example: 25 })
  total_damage_points: number;

  @ApiProperty({ description: 'List of accessories' })
  accessories: any[];

  @ApiProperty({ description: 'List of condition groups (Day/Night, Wet/Dry, etc)' })
  condition_groups: any[];

  @ApiProperty({ description: 'Array of prefill details', type: [JobCardPrefillItemDto] })
  prefill_details: JobCardPrefillItemDto[];
}
