import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** DTO for setting or updating the price ceiling of a sub-service within a service area. */
export class UpsertLocationPricingDto {
  @ApiProperty({ example: 1, description: 'ID of the sub-service to configure' })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  sub_service_id: number;

  @ApiProperty({
    example: 20,
    description: 'Kilometres included in the base price — no extra charge below this distance',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  base_distance: number;

  @ApiProperty({
    example: 2000,
    description: 'Maximum base price the vendor can charge (ceiling) for trips within base_distance',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  base_price: number;

  @ApiProperty({
    example: 25,
    description: 'Maximum price per km the vendor can charge beyond base_distance',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  extra_distance_price: number;
}
