import { IsInt, IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID of the completed order', example: 15 })
  @IsNotEmpty()
  @IsInt()
  orderId: number;

  @ApiProperty({ description: 'Rating from 1 to 5', example: 5, minimum: 1, maximum: 5 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Short title for the review', example: 'Excellent Service', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed review comment', example: 'Driver arrived quickly and handled the vehicle professionally.', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({
    description: 'Review tags',
    example: ['Professional', 'Friendly'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Submit review anonymously', example: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;
}
