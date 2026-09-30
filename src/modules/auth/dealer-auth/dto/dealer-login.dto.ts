import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class DealerLoginDto {
  @ApiProperty({ example: 'dealer@example.com', description: 'Dealer email' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Dealer password' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
