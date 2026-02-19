import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum StorageProvider {
  CloudFlareR2 = 'cloudflare-r2',
}

export class StorageEnv {
  @IsEnum(StorageProvider)
  STORAGE_PROVIDER: StorageProvider;

  @IsString()
  @IsNotEmpty()
  R2_ACCOUNT_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  R2_BUCKET_NAME: string;

  @IsString()
  R2_PUBLIC_URL: string;
}
