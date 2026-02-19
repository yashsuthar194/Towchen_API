import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { TypedConfigService } from 'src/core/config/typed-config.service';
import { IStorageService } from '../interfaces/storage.interface';
import { CloudflareR2Config } from '../types/cloud-flare';
import { FileResponseDto } from '../types/file-response';
import { UploadFileDto } from '../types/upload-file';

/**
 * CloudFlare R2 storage service implementation
 * Implements IStorageService using CloudFlare R2 (S3-compatible) storage
 *
 * @remarks
 * CloudFlare R2 is compatible with the AWS S3 API, so we use the AWS SDK
 * The endpoint format is: https://<accountId>.r2.cloudflarestorage.com
 *
 * @example
 * Environment variables required:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_URL (optional)
 */
@Injectable()
export class CloudflareR2StorageService implements IStorageService {
  private readonly logger = new Logger(CloudflareR2StorageService.name);
  private readonly s3Client: S3Client;
  private readonly config: CloudflareR2Config;

  constructor(private readonly _configService: TypedConfigService) {
    this.config = {
      accountId: this._configService.storage.R2_ACCOUNT_ID,
      accessKeyId: this._configService.storage.R2_ACCESS_KEY_ID,
      secretAccessKey: this._configService.storage.R2_SECRET_ACCESS_KEY,
      bucketName: this._configService.storage.R2_BUCKET_NAME,
      publicUrl: this._configService.storage.R2_PUBLIC_URL,
    };

    this.validateConfiguration();

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });

    this.logger.log('CloudFlare R2 storage service initialized');
  }

  /**
   * Validates required configuration parameters
   * @throws {Error} If any required configuration is missing
   * @private
   */
  private validateConfiguration(): void {
    const requiredFields: (keyof CloudflareR2Config)[] = [
      'accountId',
      'accessKeyId',
      'secretAccessKey',
      'bucketName',
    ];

    const missingFields = requiredFields.filter((field) => !this.config[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required R2 configuration: ${missingFields.join(', ')}`,
      );
    }
  }

  /**
   * Generates a unique file key with optional folder path
   *
   * @param originalName - Original filename
   * @param folderPath - Optional folder path
   * @returns Unique file key with format: [folderPath/]uuid-originalName
   * @private
   *
   * @example
   * generateUniqueFileKey('document.pdf', 'vendor/documents')
   * // Returns: 'vendor/documents/550e8400-e29b-41d4-a716-446655440000-document.pdf'
   */
  private generateUniqueFileKey(
    originalName: string,
    folderPath?: string,
  ): string {
    const uuid = uuidv4();
    const extension = extname(originalName);
    const nameWithoutExt = originalName.replace(extension, '');
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '-');
    const uniqueFileName = `${uuid}-${sanitizedName}${extension}`;

    return folderPath
      ? `${folderPath.replace(/^\/|\/$/g, '')}/${uniqueFileName}`
      : uniqueFileName;
  }

  /**
   * Constructs the public URL for a file
   *
   * @param fileKey - Unique file identifier
   * @returns Public URL if configured, otherwise signed URL endpoint
   * @private
   */
  private constructPublicUrl(fileKey: string): string {
    if (this.config.publicUrl) {
      return `${this.config.publicUrl}/${fileKey}`;
    }
    return `https://${this.config.accountId}.r2.cloudflarestorage.com/${this.config.bucketName}/${fileKey}`;
  }

  /**
   * {@inheritDoc IStorageService.uploadFileAsync}
   */
  async uploadFileAsync(
    uploadFileDto: UploadFileDto,
  ): Promise<FileResponseDto> {
    try {
      const fileKey = this.generateUniqueFileKey(
        uploadFileDto.originalName,
        uploadFileDto.folderPath,
      );

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
        Body: uploadFileDto.buffer,
        ContentType: uploadFileDto.mimeType,
        ContentLength: uploadFileDto.size,
      });

      await this.s3Client.send(command);

      this.logger.log(`File uploaded successfully: ${fileKey}`);

      return {
        fileKey,
        url: this.constructPublicUrl(fileKey),
        fileName: uploadFileDto.originalName,
        mimeType: uploadFileDto.mimeType,
        size: uploadFileDto.size,
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * {@inheritDoc IStorageService.deleteFileAsync}
   */
  async deleteFileAsync(fileKey: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully: ${fileKey}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * {@inheritDoc IStorageService.getFileUrlAsync}
   */
  async getFileUrlAsync(
    fileKey: string,
    expiresInSeconds: number = 3600,
  ): Promise<string> {
    try {
      // If public URL is configured, return it directly
      if (this.config.publicUrl) {
        return this.constructPublicUrl(fileKey);
      }

      // Otherwise, generate a signed URL
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      return signedUrl;
    } catch (error) {
      this.logger.error(
        `Failed to generate file URL: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to generate file URL: ${error.message}`);
    }
  }

  /**
   * {@inheritDoc IStorageService.getFileAsync}
   */
  async getFileAsync(fileKey: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error('File body is empty');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve file: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to retrieve file: ${error.message}`);
    }
  }

  /**
   * {@inheritDoc IStorageService.fileExistsAsync}
   */
  async fileExistsAsync(fileKey: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      this.logger.error(
        `Failed to check file existence: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to check file existence: ${error.message}`);
    }
  }
}
