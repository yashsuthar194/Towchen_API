import { IsInt, IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, ValidateNested, IsArray, ValidateIf, IsDateString, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { JourneyType } from '@prisma/client';

export class OrderConditionInputDto {
  @IsInt()
  id: number;

  @IsString()
  condition: string;

  @IsString()
  status: string;
}

export class CreateOrderV2Dto {
  /** Customer Vehicle ID */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customer_vehicle_id?: number;

  /** Service ID */
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  service_id: number;

  /** Sub-Service ID (Fleet Type) */
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  sub_service_id: number;

  /** Breakdown location place_id from address search predictions */
  @IsNotEmpty()
  @IsString()
  breakdown_place_id: string;

  /** Drop location place_id from address search predictions. Required only for FourWay journey sub-services. */
  @ValidateIf((o) => o.journey_type === JourneyType.FourWay)
  @IsNotEmpty({ message: 'dropoff_place_id is required for FourWay journey sub-services' })
  @IsString()
  dropoff_place_id?: string;

  /** Breakdown Contact Name */
  @IsOptional()
  @IsString()
  breakdown_contact_name?: string;

  /** Breakdown Contact Number */
  @IsOptional()
  @IsString()
  breakdown_contact_number?: string;

  /** Drop Contact Name */
  @IsOptional()
  @IsString()
  drop_contact_name?: string;

  /** Drop Contact Number */
  @IsOptional()
  @IsString()
  drop_contact_number?: string;

  /** Optional referral/discount voucher code to apply */
  @IsOptional()
  @IsString()
  voucher_code?: string;

  // --------------------------------------------------------
  // FLATTENED SUB-SERVICE ESTIMATE FIELDS
  // --------------------------------------------------------

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ton?: number;

  @IsOptional()
  @IsEnum(JourneyType)
  journey_type?: JourneyType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  base_distance_int?: number;

  @IsOptional()
  @IsString()
  base_rate_string?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  base_rate_int?: number;

  @IsOptional()
  @IsString()
  extra_distance_string?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extra_distance_int?: number;

  @IsOptional()
  @IsString()
  calculated_distance_string?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  calculated_distance_int?: number;

  @IsOptional()
  @IsString()
  extra_distance_rate_string?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extra_distance_rate_int?: number;

  @IsOptional()
  @IsString()
  final_amount_string?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  final_amount_int?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cgst_rate_int?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sgst_rate_int?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  other_tax_rate_int?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cgst_int?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sgst_int?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  other_tax_int?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  grand_total_int?: number;

  @IsOptional()
  @IsString()
  cgst_string?: string;

  @IsOptional()
  @IsString()
  sgst_string?: string;

  @IsOptional()
  @IsString()
  other_tax_string?: string;

  @IsOptional()
  @IsString()
  grand_total_string?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderConditionInputDto)
  conditions?: OrderConditionInputDto[];

  /**
   * ISO 8601 datetime string for scheduled orders.
   * When present, the order is saved as a booking and promoted to an active
   * order at the specified time instead of being created immediately.
   *
   * @example "2026-06-05T10:00:00+05:30"
   */
  @IsOptional()
  @IsString({ message: 'scheduled_at must be a string' })
  scheduled_at?: string;

  /** Exactly 4 pre-booked images required from customer */
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Exactly 4 pre-booked images' })
  @IsOptional()
  pre_booked_images?: Express.Multer.File[];
}
