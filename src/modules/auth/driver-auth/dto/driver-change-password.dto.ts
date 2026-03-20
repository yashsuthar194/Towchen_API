import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverChangePasswordDto {
  @ApiProperty({ description: 'Current password', example: 'oldPassword123' })
  @IsNotEmpty()
  @IsString()
  old_password: string;

  @ApiProperty({ description: 'New password', example: 'newPassword123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  new_password: string;
}
