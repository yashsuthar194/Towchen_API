import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateAdminDto {
  @ApiProperty({ example: 'newadmin@towchen.com', description: 'Admin email address', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email' })
  email?: string;

  @ApiProperty({ example: 'John Doe', description: 'Admin full name', required: false })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @ApiProperty({ example: 'Admin', enum: Role, description: 'Admin Role', required: false })
  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role provided' })
  role?: Role;
}
