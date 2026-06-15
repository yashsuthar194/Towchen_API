import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class EJobCardDamageDto {
  @ApiProperty({ description: 'The point number of the damage from the vehicle diagram', example: 1 })
  @IsNotEmpty()
  @IsInt()
  damage_number: number;

  @ApiProperty({ description: 'The image URL showing the damage', example: 'https://example.com/damage-1.jpg' })
  @IsNotEmpty()
  @IsString()
  image_url: string;
}

export class SubmitPickupJobCardDto {
  @ApiProperty({ description: 'Fuel amount (e.g. 50%)', example: '50%' })
  @IsNotEmpty()
  @IsString()
  fuel_amount: string;

  @ApiProperty({ description: 'Odometer reading text', example: '124500 km' })
  @IsNotEmpty()
  @IsString()
  odometer_reading_text: string;

  @ApiProperty({ description: 'Odometer image URL', example: 'https://example.com/odometer.jpg' })
  @IsNotEmpty()
  @IsString()
  odometer_image: string;

  @ApiProperty({ description: 'Driver image URL', example: 'https://example.com/driver.jpg' })
  @IsNotEmpty()
  @IsString()
  driver_image: string;

  @ApiProperty({ description: 'Driver signature image URL', example: 'https://example.com/signature.jpg' })
  @IsNotEmpty()
  @IsString()
  driver_sign: string;

  @ApiProperty({ description: 'Remarks/comments', example: 'Front bumper scratches noted.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ description: 'General vehicle images', type: [String], example: ['https://example.com/car-front.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vehicle_images?: string[];

  @ApiProperty({ description: 'Damage details by points', type: [EJobCardDamageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EJobCardDamageDto)
  damages?: EJobCardDamageDto[];
}
