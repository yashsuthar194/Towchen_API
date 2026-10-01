import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class DealerProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'DLR0000001' })
  formated_id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: '+919876543210' })
  number: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  alternative_number?: string | null;

  @ApiProperty({ example: 'dealer@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.Dealer })
  role: Role;

  @ApiPropertyOptional({ example: '123 Main Street, City' })
  residential_address?: string | null;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  bank_name?: string | null;

  @ApiProperty({ example: 'HDFC0001234' })
  ifsc_code: string;

  @ApiProperty({ example: '123456789012' })
  account_number: string;

  @ApiProperty({ example: 'John Doe' })
  account_holder_name: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/dealer.jpg' })
  dealer_image?: string | null;

  @ApiProperty({ example: 'https://storage.example.com/aadhar.jpg' })
  aadhar_image: string;

  @ApiProperty({ example: 'https://storage.example.com/pan.jpg' })
  pan_image: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/bankdetails.jpg' })
  bankdetails_image?: string | null;

  @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-09-30T12:00:00.000Z' })
  updated_at: Date;
}

export class DealerLoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ type: DealerProfileDto, description: 'Dealer profile information' })
  dealer: DealerProfileDto;
}
