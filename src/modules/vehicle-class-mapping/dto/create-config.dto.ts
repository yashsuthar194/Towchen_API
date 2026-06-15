import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleClassConfigDto {
  @ApiProperty({
    description: 'The mapped standard vehicle class (e.g. Car, Bike, Riksaw)',
    example: 'Car',
  })
  @IsNotEmpty()
  @IsString()
  mapped_class: string;

  @ApiProperty({
    description: 'The URL to the diagram image of the vehicle containing numbers',
    example: 'https://towchen-storage.s3.amazonaws.com/diagrams/car.png',
  })
  @IsNotEmpty()
  @IsString()
  diagram_image_url: string;

  @ApiProperty({
    description: 'The total number of damage points available on this diagram',
    example: 25,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  total_damage_points: number;
}
