import { ApiProperty } from '@nestjs/swagger';

export class AccessoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  vehicle_class_configuration_id: number;

  @ApiProperty({ example: 'Hub Caps' })
  name: string;
}

export class ConditionOptionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  vehicle_state_id: number;

  @ApiProperty({ example: 'Day' })
  name: string;
}

export class ConditionGroupResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  vehicle_class_configuration_id: number;

  @ApiProperty({ example: 'Time of Day' })
  name: string;

  @ApiProperty({ type: [ConditionOptionResponseDto] })
  options: ConditionOptionResponseDto[];
}

export class VehicleClassConfigResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Car' })
  mapped_class: string;

  @ApiProperty({ type: [String], example: ['SUV', 'LMV', 'SEDAN', 'HATCHBACK'] })
  sub_classes: string[];

  @ApiProperty({ example: 'https://example.com/diagram.png' })
  diagram_image_url: string;

  @ApiProperty({ example: 25 })
  total_damage_points: number;

  @ApiProperty({ type: [AccessoryResponseDto] })
  accessories: AccessoryResponseDto[];

  @ApiProperty({ type: [ConditionGroupResponseDto] })
  vehicle_state: ConditionGroupResponseDto[];
}
