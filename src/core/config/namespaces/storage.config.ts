import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ConfigNamespace } from '../helper/config.decorator';
import { createConfigLoader } from '../helper/config.loader';

export enum StorageProvider {
  CloudFlareR2 = 'cloudflare-R2',
}

@ConfigNamespace('storage')
export class StorageConfig {
  @IsEnum(StorageProvider, {
    message: `STORAGE_PROVIDER must be one of: ${Object.values(StorageProvider).join(', ')}`,
  })
  @IsOptional()
  STORAGE_PROVIDER: StorageProvider = StorageProvider.CloudFlareR2;

  @IsString({ message: 'R2_ACCOUNT_ID must be a string' })
  @IsNotEmpty({ message: 'R2_ACCOUNT_ID is required and cannot be empty' })
  R2_ACCOUNT_ID: string;

  @IsString({ message: 'R2_ACCESS_KEY_ID must be a string' })
  @IsNotEmpty({ message: 'R2_ACCESS_KEY_ID is required and cannot be empty' })
  R2_ACCESS_KEY_ID: string;

  @IsString({ message: 'R2_SECRET_ACCESS_KEY must be a string' })
  @IsNotEmpty({
    message: 'R2_SECRET_ACCESS_KEY is required and cannot be empty',
  })
  R2_SECRET_ACCESS_KEY: string;

  @IsString({ message: 'R2_BUCKET_NAME must be a string' })
  @IsNotEmpty({ message: 'R2_BUCKET_NAME is required and cannot be empty' })
  R2_BUCKET_NAME: string;

  @IsString({ message: 'R2_PUBLIC_URL must be a string' })
  @IsNotEmpty({ message: 'R2_PUBLIC_URL is required and cannot be empty' })
  R2_PUBLIC_URL: string;

  // Computed properties for easier access
  get provider(): StorageProvider {
    return this.STORAGE_PROVIDER;
  }

  get accountId(): string {
    return this.R2_ACCOUNT_ID;
  }

  get accessKeyId(): string {
    return this.R2_ACCESS_KEY_ID;
  }

  get secretAccessKey(): string {
    return this.R2_SECRET_ACCESS_KEY;
  }

  get bucketName(): string {
    return this.R2_BUCKET_NAME;
  }

  get publicUrl(): string {
    return this.R2_PUBLIC_URL;
  }
}

// Export the loader for use in the module
export const storageConfig = createConfigLoader(StorageConfig);
