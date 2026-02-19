import { registerAs } from '@nestjs/config';
import { StorageProvider } from '../envs/storage.env';

export const storageConfig = registerAs('storage', () => ({
  STORAGE_PROVIDER:
    process.env.STORAGE_PROVIDER ?? StorageProvider.CloudFlareR2,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID!,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID!,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY!,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME!,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
}));

export type StorageConfig = ReturnType<typeof storageConfig>;
