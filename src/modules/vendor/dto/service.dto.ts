import { ApiProperty } from '@nestjs/swagger';
import { JourneyType } from '@prisma/client';

export class SubServiceConditionDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  sub_service_id: number;

  @ApiProperty()
  condition: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class SubServiceDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty()
  service_id: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty()
  fix_distance: number;

  @ApiProperty()
  fix_price: number;

  @ApiProperty()
  extra_price: number;

  @ApiProperty()
  ton: number;

  @ApiProperty({ required: false, nullable: true })
  image_url?: string | null;

  @ApiProperty({ enum: JourneyType })
  journey_type: JourneyType;

  @ApiProperty({ type: [SubServiceConditionDto], required: false })
  conditions?: SubServiceConditionDto[];
}

export class ServiceDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: [SubServiceDto], required: false })
  sub_services?: SubServiceDto[];
}
