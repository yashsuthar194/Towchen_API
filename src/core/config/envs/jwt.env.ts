import { IsString, MinLength } from 'class-validator';

export class JwtEnv {
  @IsString()
  @MinLength(10, { message: 'JWT_SECRET must be at least 10 characters' })
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string = '7d';
}
