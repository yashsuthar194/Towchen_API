import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverLoginDto {
  @ApiProperty({ description: 'Driver ID (e.g., DRV001)', example: 'DRV001' })
  @IsString()
  @IsNotEmpty()
  formated_id: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
