import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PricedSubServiceDto } from 'src/modules/location/dto/order-estimate-response.dto';

export class CalculateVoucherRequestDto {
  @ApiProperty({ description: 'The voucher code the customer is applying', example: 'TOW-123456' })
  @IsNotEmpty()
  @IsString()
  voucher_code: string;

  @ApiProperty({
    description: 'The full sub-service object selected by the user (from location estimate)',
    type: PricedSubServiceDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PricedSubServiceDto)
  sub_service: PricedSubServiceDto;
}

export class CalculatedVoucherResponseDto {
  @ApiProperty({ description: 'The voucher code that was successfully applied' })
  applied_voucher_code: string;

  @ApiProperty({ description: 'The percentage of the discount applied' })
  discount_percent: number;

  @ApiProperty({ description: 'The raw discount amount subtracted from the base price' })
  discount_amount: number;

  @ApiProperty({ description: 'Discount amount formatted with rupee symbol' })
  discount_amount_formatted: string;

  @ApiProperty({
    description: 'The updated sub-service object with recalculated taxes and grand total',
    type: PricedSubServiceDto,
  })
  updated_sub_service: PricedSubServiceDto;
}
