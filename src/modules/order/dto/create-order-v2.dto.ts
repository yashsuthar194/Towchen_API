import { IsInt, IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, ValidateNested, IsArray, ValidateIf, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
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
  @IsInt()
  customer_vehicle_id?: number;

  /** Service ID */
  @IsNotEmpty()
  @IsInt()
  service_id: number;

  /** Sub-Service ID (Fleet Type) */
  @IsNotEmpty()
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
  @IsNumber()
  ton?: number;

  @IsOptional()
  @IsEnum(JourneyType)
  journey_type?: JourneyType;

  @IsOptional()
  @IsNumber()
  base_distance_int?: number;

  @IsOptional()
  @IsString()
  base_rate_string?: string;

  @IsOptional()
  @IsNumber()
  base_rate_int?: number;

  @IsOptional()
  @IsString()
  extra_distance_string?: string;

  @IsOptional()
  @IsNumber()
  extra_distance_int?: number;

  @IsOptional()
  @IsString()
  calculated_distance_string?: string;

  @IsOptional()
  @IsNumber()
  calculated_distance_int?: number;

  @IsOptional()
  @IsString()
  extra_distance_rate_string?: string;

  @IsOptional()
  @IsNumber()
  extra_distance_rate_int?: number;

  @IsOptional()
  @IsString()
  final_amount_string?: string;

  @IsOptional()
  @IsNumber()
  final_amount_int?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  cgst_rate_int?: number;

  @IsOptional()
  @IsNumber()
  sgst_rate_int?: number;

  @IsOptional()
  @IsNumber()
  other_tax_rate_int?: number;

  @IsOptional()
  @IsNumber()
  cgst_int?: number;

  @IsOptional()
  @IsNumber()
  sgst_int?: number;

  @IsOptional()
  @IsNumber()
  other_tax_int?: number;

  @IsOptional()
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
  @IsDateString({}, { message: 'scheduled_at must be a valid ISO 8601 datetime string' })
  scheduled_at?: string;
}
