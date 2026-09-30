import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateDealerDto {
  @ApiProperty({ example: 'John Doe', description: 'Dealer full name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: '+919876543210', description: 'Contact number' })
  @IsString()
  @IsNotEmpty({ message: 'Number is required' })
  number: string;

  @ApiPropertyOptional({ example: '+919876543211', description: 'Alternative contact number' })
  @IsString()
  @IsOptional()
  alternative_number?: string;

  @ApiProperty({ example: 'dealer@example.com', description: 'Dealer email' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'Dealer account password (minimum 6 characters)' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({ example: '123 Main Street, City', description: 'Residential address' })
  @IsString()
  @IsOptional()
  residential_address?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank', description: 'Bank name' })
  @IsString()
  @IsOptional()
  bank_name?: string;

  @ApiProperty({ example: 'HDFC0001234', description: 'Bank IFSC code' })
  @IsString()
  @IsNotEmpty({ message: 'IFSC code is required' })
  ifsc_code: string;

  @ApiProperty({ example: '123456789012', description: 'Bank account number' })
  @IsString()
  @IsNotEmpty({ message: 'Account number is required' })
  account_number: string;

  @ApiProperty({ example: 'John Doe', description: 'Account holder name' })
  @IsString()
  @IsNotEmpty({ message: 'Account holder name is required' })
  account_holder_name: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/dealer.jpg', description: 'Dealer profile image URL' })
  @IsString()
  @IsOptional()
  dealer_image?: string;

  @ApiProperty({ example: 'https://storage.example.com/aadhar.jpg', description: 'Aadhar image URL' })
  @IsString()
  @IsNotEmpty({ message: 'Aadhar image is required' })
  aadhar_image: string;

  @ApiProperty({ example: 'https://storage.example.com/pan.jpg', description: 'PAN image URL' })
  @IsString()
  @IsNotEmpty({ message: 'PAN image is required' })
  pan_image: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/bankdetails.jpg', description: 'Bank details passbook / cheque image URL' })
  @IsString()
  @IsOptional()
  bankdetails_image?: string;
}
