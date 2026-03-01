import { IsNotEmpty, IsString } from 'class-validator';

export class VerificationEnv {

  @IsString()
  @IsNotEmpty()
  TWILIO_ACCOUNT_SID: string;

  @IsString()
  @IsNotEmpty()
  TWILIO_AUTH_TOKEN: string;

  @IsString()
  @IsNotEmpty()
  TWILIO_PHONE_NUMBER: string;

  @IsString()
  @IsNotEmpty()
  MAIL_HOST: string;

  @IsNotEmpty()
  MAIL_PORT: number;

  @IsString()
  @IsNotEmpty()
  MAIL_USER: string;

  @IsString()
  @IsNotEmpty()
  MAIL_PASS: string;

  @IsString()
  MAIL_FROM?: string;
}
