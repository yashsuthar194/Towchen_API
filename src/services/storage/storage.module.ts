import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { StorageProvider } from 'src/core/config/envs/storage.env';
import { CloudflareR2StorageService } from './providers/cloudflare-r2.service';

/**
 * Storage module providing file storage services
 *
 * @remarks
 * This module uses the Strategy pattern to allow switching between different storage providers.
 * The current implementation uses CloudFlare R2, but can be easily switched to other providers.
 *
 * Environment variables required:
 * - STORAGE_PROVIDER (optional, defaults to 'cloudflare-r2')
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_URL (optional)
 *
 * @example
 * Import in your module:
 * ```typescript
 * @Module({
 *   imports: [StorageModule],
 *   controllers: [VendorController],
 *   providers: [VendorService],
 * })
 * export class VendorModule {}
 * ```
 *
 * Use in your service:
 * ```typescript
 * constructor(private readonly storageService: StorageService) {}
 * ```
 */
@Module({
  providers: [
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: (config: TypedConfigService) => {
        const provider = config.storage.STORAGE_PROVIDER;
        switch (provider) {
          case StorageProvider.CloudFlareR2:
            return new CloudflareR2StorageService(config);
          default:
            return new CloudflareR2StorageService(config);
        }
      },
      inject: [TypedConfigService],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
