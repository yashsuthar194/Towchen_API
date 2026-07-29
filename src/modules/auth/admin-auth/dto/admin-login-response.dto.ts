import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

class AdminProfileDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: Role })
  role: Role;
}

export class AdminLoginResponseDto {
  @ApiProperty({ description: 'JWT access token for the admin' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token for the admin' })
  refreshToken: string;

  @ApiProperty({ type: AdminProfileDto, description: 'Admin basic profile information' })
  admin: AdminProfileDto;
}
