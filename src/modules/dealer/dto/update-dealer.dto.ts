import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateDealerDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Dealer full name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Contact number' })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({ example: '+919876543211', description: 'Alternative contact number' })
  @IsString()
  @IsOptional()
  alternative_number?: string;

  @ApiPropertyOptional({ example: 'updated_dealer@example.com', description: 'Dealer email' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'NewPassword123!', description: 'Dealer account password (minimum 6 characters)' })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiPropertyOptional({ example: '123 Main Street, City', description: 'Residential address' })
  @IsString()
  @IsOptional()
  residential_address?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank', description: 'Bank name' })
  @IsString()
  @IsOptional()
  bank_name?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234', description: 'Bank IFSC code' })
  @IsString()
  @IsOptional()
  ifsc_code?: string;

  @ApiPropertyOptional({ example: '123456789012', description: 'Bank account number' })
  @IsString()
  @IsOptional()
  account_number?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'Account holder name' })
  @IsString()
  @IsOptional()
  account_holder_name?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/dealer.jpg', description: 'Dealer profile image URL' })
  @IsString()
  @IsOptional()
  dealer_image?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/aadhar.jpg', description: 'Aadhar image URL' })
  @IsString()
  @IsOptional()
  aadhar_image?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/pan.jpg', description: 'PAN image URL' })
  @IsString()
  @IsOptional()
  pan_image?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/bankdetails.jpg', description: 'Bank details passbook / cheque image URL' })
  @IsString()
  @IsOptional()
  bankdetails_image?: string;
}
