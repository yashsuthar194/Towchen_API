import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateRouteDto {
  @ApiProperty({ description: 'Start location place_id', example: 'ChIJxT1...place_id' })
  @IsNotEmpty()
  @IsString()
  start_location: string;

  @ApiProperty({ description: 'End location place_id', example: 'ChIJ...place_id' })
  @IsNotEmpty()
  @IsString()
  end_location: string;
}
