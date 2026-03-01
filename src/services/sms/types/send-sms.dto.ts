import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class SendSmsDto {
  @IsString({ message: 'To must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'To must be a valid E.164 format phone number (e.g., +1234567890)',
  })
  @IsNotEmpty({ message: 'To phone number is required' })
  to: string;

  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message content is required' })
  message: string;

  @IsString({ message: 'From must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'From must be a valid E.164 format phone number',
  })
  @IsOptional()
  from?: string;

  @IsString({ message: 'Media URL must be a string' })
  @IsOptional()
  mediaUrl?: string; // For MMS support

  @IsOptional()
  metadata?: Record<string, any>; // Provider-specific options
}
