import { Injectable, Inject } from '@nestjs/common';
import { IStorageService } from './interfaces/storage.interface';
import { UploadFileDto } from './types/upload-file';
import { FileResponseDto } from './types/file-response';

/**
 * Main storage service that acts as a facade/context for the Strategy pattern
 * Delegates all storage operations to the configured storage provider
 *
 * @remarks
 * This service allows easy switching between different storage providers
 * (CloudFlare R2, AWS S3, Azure Blob, etc.) without changing client code
 *
 * @example
 * ```typescript
 * constructor(private readonly storageService: StorageService) {}
 *
 * async uploadVendorDocument(file: Express.Multer.File) {
 *   const result = await this.storageService.uploadFileAsync({
 *     buffer: file.buffer,
 *     originalName: file.originalname,
 *     mimeType: file.mimetype,
 *     size: file.size,
 *     folderPath: 'vendor/documents'
 *   });
 *   return result;
 * }
 * ```
 */
@Injectable()
export class StorageService implements IStorageService {
  constructor(
    @Inject('STORAGE_PROVIDER')
    private readonly storageProvider: IStorageService,
  ) {}

  /**
   * {@inheritDoc IStorageService.uploadFileAsync}
   */
  async uploadFileAsync(
    uploadFileDto: UploadFileDto,
  ): Promise<FileResponseDto> {
    return this.storageProvider.uploadFileAsync(uploadFileDto);
  }

  /**
   * {@inheritDoc IStorageService.deleteFileAsync}
   */
  async deleteFileAsync(fileKey: string): Promise<boolean> {
    return this.storageProvider.deleteFileAsync(fileKey);
  }

  /**
   * {@inheritDoc IStorageService.getFileUrlAsync}
   */
  async getFileUrlAsync(
    fileKey: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    return this.storageProvider.getFileUrlAsync(fileKey, expiresInSeconds);
  }

  /**
   * {@inheritDoc IStorageService.getFileAsync}
   */
  async getFileAsync(fileKey: string): Promise<Buffer> {
    return this.storageProvider.getFileAsync(fileKey);
  }

  /**
   * {@inheritDoc IStorageService.fileExistsAsync}
   */
  async fileExistsAsync(fileKey: string): Promise<boolean> {
    return this.storageProvider.fileExistsAsync(fileKey);
  }
}
