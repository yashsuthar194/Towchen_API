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
  fix_distance: number;

  @ApiProperty({
    example: 2000,
    description: 'Maximum base price the vendor can charge (ceiling) for trips within fix_distance',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fix_price: number;

  @ApiProperty({
    example: 25,
    description: 'Maximum price per km the vendor can charge beyond fix_distance',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  extra_price: number;
}
