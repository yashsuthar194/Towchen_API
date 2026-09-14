import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class PurchaseVehicleItemDto {
  @ApiProperty({ description: 'The ID of the customer vehicle' })
  @IsInt()
  @IsNotEmpty()
  customer_vehicle_id: number;

  @ApiProperty({
    description: 'The ID of the subscription plan selected for this vehicle',
  })
  @IsInt()
  @IsNotEmpty()
  subscription_plan_id: number;
}

export class PurchaseSubscriptionDto {
  @ApiProperty({
    description:
      'JSON stringified array of vehicles (if sending multipart/form-data) or standard array',
    type: [PurchaseVehicleItemDto],
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseVehicleItemDto)
  vehicles: PurchaseVehicleItemDto[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description:
      'Array of RC book document files (must match the order of vehicles)',
  })
  rc_books: any[];
}
