import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactInquiryDto {
  @ApiProperty({ description: 'Full name of the contact person', example: 'Rajesh Kumar' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Phone number', example: '9812345678' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Email address', example: 'rajesh@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Subject or department inquiry category', example: 'Dealership RSA Partnership' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Inquiry details or message', example: 'Interested in partnering with Towchen for RSA.' })
  @IsNotEmpty()
  @IsString()
  message: string;
}
