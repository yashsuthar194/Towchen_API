import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DealerResponseDto {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  id: number;

  @ApiProperty({ example: 'DLR0000001', description: 'Formatted dealer ID' })
  formated_id: string;

  @ApiProperty({ example: 'John Doe', description: 'Dealer full name' })
  name: string;

  @ApiProperty({ example: '+919876543210', description: 'Contact number' })
  number: string;

  @ApiPropertyOptional({ example: '+919876543211', description: 'Alternative contact number' })
  alternative_number?: string | null;

  @ApiProperty({ example: 'dealer@example.com', description: 'Dealer email' })
  email: string;

  @ApiPropertyOptional({ example: '123 Main Street, City', description: 'Residential address' })
  residential_address?: string | null;

  @ApiPropertyOptional({ example: 'HDFC Bank', description: 'Bank name' })
  bank_name?: string | null;

  @ApiProperty({ example: 'HDFC0001234', description: 'Bank IFSC code' })
  ifsc_code: string;

  @ApiProperty({ example: '123456789012', description: 'Bank account number' })
  account_number: string;

  @ApiProperty({ example: 'John Doe', description: 'Account holder name' })
  account_holder_name: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/dealer.jpg', description: 'Dealer profile image URL' })
  dealer_image?: string | null;

  @ApiProperty({ example: 'https://storage.example.com/aadhar.jpg', description: 'Aadhar image URL' })
  aadhar_image: string;

  @ApiProperty({ example: 'https://storage.example.com/pan.jpg', description: 'PAN image URL' })
  pan_image: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/bankdetails.jpg', description: 'Bank details image URL' })
  bankdetails_image?: string | null;

  @ApiProperty({ example: '2026-09-30T12:00:00.000Z', description: 'Created timestamp' })
  created_at: Date;

  @ApiProperty({ example: '2026-09-30T12:00:00.000Z', description: 'Updated timestamp' })
  updated_at: Date;
}

export class DealerPaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page limit' })
  limit: number;

  @ApiProperty({ example: 25, description: 'Total records count' })
  total: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  total_pages: number;
}

export class DealerListResponseDto {
  @ApiProperty({ type: [DealerResponseDto], description: 'List of dealers' })
  items: DealerResponseDto[];

  @ApiProperty({ type: DealerPaginationMetaDto, description: 'Pagination metadata' })
  pagination: DealerPaginationMetaDto;
}
