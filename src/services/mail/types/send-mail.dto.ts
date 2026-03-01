import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';

export class SendMailDto {
  @IsEmail({}, { message: 'To must be a valid email address' })
  @IsNotEmpty({ message: 'To email is required' })
  to: string;

  @IsString({ message: 'From must be a string' })
  @IsEmail({}, { message: 'From must be a valid email address' })
  @IsOptional()
  from?: string;

  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @IsString({ message: 'Text content must be a string' })
  @IsNotEmpty({ message: 'Text content is required' })
  text: string;

  @IsString({ message: 'HTML content must be a string' })
  @IsOptional()
  html?: string;

  @IsArray({ message: 'CC must be an array of email addresses' })
  @IsEmail({}, { each: true, message: 'Each CC must be a valid email address' })
  @IsOptional()
  cc?: string[];

  @IsArray({ message: 'BCC must be an array of email addresses' })
  @IsEmail({}, { each: true, message: 'Each BCC must be a valid email address' })
  @IsOptional()
  bcc?: string[];

  @IsOptional()
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}
