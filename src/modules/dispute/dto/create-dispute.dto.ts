import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { DisputeType } from '@prisma/client';

export class CreateDisputeDto {
  @ApiProperty({
    description: 'Numeric ID of the completed order being disputed',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  order_id: number;

  @ApiProperty({
    enum: DisputeType,
    description: 'Classification of the dispute',
    example: DisputeType.TollDispute,
  })
  @IsEnum(DisputeType)
  @IsNotEmpty()
  dispute_type: DisputeType;

  @ApiProperty({
    description: 'Amount demanded by the vendor (e.g. ₹500 for toll)',
    example: 500.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  demanded_amount: number;

  @ApiPropertyOptional({
    description: 'Detailed explanation or remarks from the vendor',
    example: 'Toll paid at Mumbai-Pune Expressway toll plaza during vehicle transit.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Array of pre-uploaded proof URLs. Alternatively, upload files directly via multipart/form-data under field "proof_images".',
    type: [String],
    example: ['https://s3.amazonaws.com/towchen-bucket/disputes/toll_receipt.jpg'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
      } catch {
        return [value];
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  proof_urls?: string[];
}
