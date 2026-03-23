import { ApiProperty } from '@nestjs/swagger';

export class DriverLoginResponseDto {
  access_token: string;
  refresh_token: string;
  is_email_verified: boolean;
  is_number_verified: boolean;

  @ApiProperty({ example: true, description: 'Indicating if all documents are uploaded' })
  is_documents_uploaded: boolean;
}
