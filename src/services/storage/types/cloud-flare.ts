/**
 * Configuration class for CloudFlare R2 storage service
 */
export class CloudflareR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string | undefined;
}