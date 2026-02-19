import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class DatabaseEnv {
  @IsString()
  @MinLength(1)
  DB_HOST: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DB_PORT: number = 5432;

  @IsString()
  @MinLength(1)
  DB_NAME: string;

  @IsString()
  @MinLength(1)
  DB_USER: string;

  @IsString()
  @MinLength(1)
  DB_PASS: string;
}
