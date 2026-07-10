import { ApiProperty } from '@nestjs/swagger';
import { EvcrfPrefillItemDto } from './evcrf-prefill-item.dto';

import { AccessoryResponseDto, ConditionGroupResponseDto } from '../../vehicle-class-mapping/dto/config-response.dto';

export class EvcrfConfigResponseDto {
  @ApiProperty({ description: 'The mapped vehicle class', example: 'Car' })
  mapped_class: string;

  @ApiProperty({ description: 'Diagram image URL' })
  diagram_image_url: string;

  @ApiProperty({ description: 'Total damage points', example: 25 })
  total_damage_points: number;

  @ApiProperty({ description: 'List of accessories', type: [AccessoryResponseDto] })
  accessories: AccessoryResponseDto[];

  @ApiProperty({ description: 'Array of vehicle state (condition groups) and their options', type: [ConditionGroupResponseDto] })
  vehicle_state: ConditionGroupResponseDto[];

  @ApiProperty({ description: 'Array of prefill details', type: [EvcrfPrefillItemDto] })
  prefill_details: EvcrfPrefillItemDto[];
}
