import { FileResponseDto } from "../types/file-response";
import { UploadFileDto } from "../types/upload-file";


/**
 * Interface defining the contract for all file storage providers
 * Implements the Strategy pattern to allow switching between different storage backends
 * (CloudFlare R2, AWS S3, Azure Blob Storage, Local Storage, etc.)
 */
export interface IStorageService {
  /**
   * Uploads a file to the storage provider
   *
   * @param uploadFileDto - File data and metadata to upload
   * @returns Promise resolving to file information including URL and unique key
   * @throws {Error} If upload fails due to network, permission, or validation issues
   *
   * @example
   * ```typescript
   * const result = await storageService.uploadFileAsync({
   *   buffer: fileBuffer,
   *   originalName: 'document.pdf',
   *   mimeType: 'application/pdf',
   *   size: 1024000,
   *   folderPath: 'vendor/documents'
   * });
   * console.log(result.url); // https://storage.example.com/vendor/documents/uuid-document.pdf
   * ```
   */
  uploadFileAsync(uploadFileDto: UploadFileDto): Promise<FileResponseDto>;

  /**
   * Deletes a file from the storage provider
   *
   * @param fileKey - Unique identifier of the file to delete
   * @returns Promise resolving to true if deletion was successful, false otherwise
   * @throws {Error} If deletion fails due to network or permission issues
   *
   * @example
   * ```typescript
   * const deleted = await storageService.deleteFileAsync('vendor/documents/uuid-document.pdf');
   * console.log(deleted); // true
   * ```
   */
  deleteFileAsync(fileKey: string): Promise<boolean>;

  /**
   * Retrieves the public or signed URL for accessing a file
   *
   * @param fileKey - Unique identifier of the file
   * @param expiresInSeconds - Optional expiration time for signed URLs (default: 3600)
   * @returns Promise resolving to the file's access URL
   * @throws {Error} If URL generation fails or file doesn't exist
   *
   * @example
   * ```typescript
   * const url = await storageService.getFileUrlAsync('vendor/documents/uuid-document.pdf', 7200);
   * console.log(url); // https://storage.example.com/vendor/documents/uuid-document.pdf?signature=...
   * ```
   */
  getFileUrlAsync(fileKey: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Downloads a file from the storage provider
   *
   * @param fileKey - Unique identifier of the file to download
   * @returns Promise resolving to the file content as Buffer
   * @throws {Error} If download fails or file doesn't exist
   *
   * @example
   * ```typescript
   * const fileBuffer = await storageService.getFileAsync('vendor/documents/uuid-document.pdf');
   * console.log(fileBuffer.length); // 1024000
   * ```
   */
  getFileAsync(fileKey: string): Promise<Buffer>;

  /**
   * Checks if a file exists in the storage provider
   *
   * @param fileKey - Unique identifier of the file
   * @returns Promise resolving to true if file exists, false otherwise
   *
   * @example
   * ```typescript
   * const exists = await storageService.fileExistsAsync('vendor/documents/uuid-document.pdf');
   * console.log(exists); // true
   * ```
   */
  fileExistsAsync(fileKey: string): Promise<boolean>;
}
