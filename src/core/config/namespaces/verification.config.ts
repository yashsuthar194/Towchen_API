import { registerAs } from '@nestjs/config';
// import { VerificationEnv } from '../envs/verification.env';

export const verificationConfig = registerAs('verification', () => ({
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID!,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN!,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER!,
  MAIL_HOST: process.env.MAIL_HOST!,
  MAIL_PORT: parseInt(process.env.MAIL_PORT!, 10),
  MAIL_USER: process.env.MAIL_USER!,
  MAIL_PASS: process.env.MAIL_PASS!,
  MAIL_FROM: process.env.MAIL_FROM,
}));

export type VerificationConfig = ReturnType<typeof verificationConfig>;
