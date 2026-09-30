import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class DealerProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'DLR0000001' })
  formated_id: string;

  @ApiProperty({ example: 'dealer@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.Dealer })
  role: Role;

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
