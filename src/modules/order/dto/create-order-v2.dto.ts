import { IsInt, IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, ValidateNested, IsArray, ValidateIf, IsDateString, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JourneyType } from '@prisma/client';

export class OrderConditionInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Must have working headlights' })
  @IsString()
  condition: string;

  @ApiProperty({ example: 'Yes' })
  @IsString()
  status: string;
}

export class CreateOrderV2Dto {
  /** Customer Vehicle ID */
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customer_vehicle_id?: number;

  /** Service ID */
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  service_id: number;

  /** Sub-Service ID (Fleet Type) */
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  sub_service_id: number;

  /** Breakdown location place_id from address search predictions */
  @ApiProperty({ example: 'ChIJv6IvMQEDDTkRxABw1XMp4co' })
  @IsNotEmpty()
  @IsString()
  breakdown_place_id: string;

  /** Drop location place_id from address search predictions. Required only for FourWay journey sub-services. */
  @ApiPropertyOptional({ example: 'ChIJn23zbkXlDDkRyDZhKLGRcTs' })
  @ValidateIf((o) => o.journey_type === JourneyType.FourWay)
  @IsNotEmpty({ message: 'dropoff_place_id is required for FourWay journey sub-services' })
  @IsString()
  dropoff_place_id?: string;

  /** Breakdown Contact Name */
  @ApiPropertyOptional({ example: 'Jainish Panchal' })
  @IsOptional()
  @IsString()
  breakdown_contact_name?: string;

  /** Breakdown Contact Number */
  @ApiPropertyOptional({ example: '9016616324' })
  @IsOptional()
  @IsString()
  breakdown_contact_number?: string;

  /** Drop Contact Name */
  @ApiPropertyOptional({ example: 'Jainish Panchal' })
  @IsOptional()
  @IsString()
  drop_contact_name?: string;

  /** Drop Contact Number */
  @ApiPropertyOptional({ example: '9016616324' })
  @IsOptional()
  @IsString()
  drop_contact_number?: string;

  /** Optional referral/discount voucher code to apply */
  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  voucher_code?: string;

  // --------------------------------------------------------
  // FLATTENED SUB-SERVICE ESTIMATE FIELDS
  // --------------------------------------------------------

  @ApiPropertyOptional({ example: 'Under Lift' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ton?: number;

  @ApiPropertyOptional({ enum: JourneyType, example: JourneyType.FourWay })
  @IsOptional()
  @IsEnum(JourneyType)
  journey_type?: JourneyType;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  base_distance_int?: number;

  @ApiPropertyOptional({ example: '₹100' })
  @IsOptional()
  @IsString()
  base_rate_string?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  base_rate_int?: number;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @IsString()
  extra_distance_string?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extra_distance_int?: number;

  @ApiPropertyOptional({ example: '36.85 km' })
  @IsOptional()
  @IsString()
  calculated_distance_string?: string;

  @ApiPropertyOptional({ example: 36.85 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  calculated_distance_int?: number;

  @ApiPropertyOptional({ example: '₹336.94' })
  @IsOptional()
  @IsString()
  extra_distance_rate_string?: string;

  @ApiPropertyOptional({ example: 336.94 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extra_distance_rate_int?: number;

  @ApiPropertyOptional({ example: '₹436.94' })
  @IsOptional()
  @IsString()
  final_amount_string?: string;

  @ApiPropertyOptional({ example: 436.94 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  final_amount_int?: number;

  @ApiPropertyOptional({ example: 'https://pub-88bff11829e24671b851121c59781ac4.r2.dev/sub-services/1/image/1780592957614-WhatsApp-Image-2026-02-08-at-4-13-25-PM.jpeg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cgst_rate_int?: number;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sgst_rate_int?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  other_tax_rate_int?: number;

  @ApiPropertyOptional({ example: 39.32 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cgst_int?: number;

  @ApiPropertyOptional({ example: 39.32 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sgst_int?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  other_tax_int?: number;

  @ApiPropertyOptional({ example: 515.58 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  grand_total_int?: number;

  @ApiPropertyOptional({ example: '₹39.32' })
  @IsOptional()
  @IsString()
  cgst_string?: string;

  @ApiPropertyOptional({ example: '₹39.32' })
  @IsOptional()
  @IsString()
  sgst_string?: string;

  @ApiPropertyOptional({ example: '₹0.00' })
  @IsOptional()
  @IsString()
  other_tax_string?: string;

  @ApiPropertyOptional({ example: '₹515.58' })
  @IsOptional()
  @IsString()
  grand_total_string?: string;

  @ApiPropertyOptional({ type: () => [OrderConditionInputDto], example: '[{"id":1,"condition":"Must have working headlights","status":"Yes"},{"id":2,"condition":"Must have free steering wheel","status":"No"},{"id":3,"condition":"Must have free handbrake","status":"Yes"},{"id":4,"condition":"Must have free gear system","status":"Yes"}]' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return plainToInstance(OrderConditionInputDto, parsed);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
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
  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString({ message: 'scheduled_at must be a string' })
  scheduled_at?: string;

  /** Exactly 4 pre-booked images required from customer */
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'Exactly 4 pre-booked images' })
  @IsOptional()
  pre_booked_images?: Express.Multer.File[];
}
