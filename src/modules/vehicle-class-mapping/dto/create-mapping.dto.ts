import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleClassMappingDto {
  @ApiProperty({
    description: 'The source vehicle class from customer vehicle details (e.g. LMV, SUV)',
    example: 'SUV',
  })
  @IsNotEmpty()
  @IsString()
  source_class: string;

  @ApiProperty({
    description: 'The normalized target class (e.g. Car, Bike, Riksaw)',
    example: 'Car',
  })
  @IsNotEmpty()
  @IsString()
  mapped_class: string;
}
