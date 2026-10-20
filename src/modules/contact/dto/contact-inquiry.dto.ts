import { ApiProperty } from '@nestjs/swagger';
import { ContactInquiryStatus } from '@prisma/client';

export class ContactInquiryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Rajesh Kumar' })
  name: string;

  @ApiProperty({ example: '9812345678' })
  phone: string;

  @ApiProperty({ example: 'rajesh@example.com' })
  email: string;

  @ApiProperty({ example: 'Dealership RSA Partnership' })
  subject: string;

  @ApiProperty({ example: 'Interested in partnering with Towchen for RSA.' })
  message: string;

  @ApiProperty({ enum: ContactInquiryStatus, example: ContactInquiryStatus.Pending })
  status: ContactInquiryStatus;

  @ApiProperty({ example: '2026-10-20T05:30:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-10-20T05:30:00.000Z' })
  updated_at: Date;
}
