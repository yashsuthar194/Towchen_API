/**
 * Data Transfer Object for file upload operations
 * Contains file buffer and metadata for storage operations
 */
export class UploadFileDto {
  /**
   * The file content as a Buffer
   */
  buffer: Buffer;

  /**
   * Original filename provided by the client
   */
  originalName: string;

  /**
   * MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
   */
  mimeType: string;

  /**
   * Size of the file in bytes
   */
  size: number;

  /**
   * Optional folder path where the file should be stored
   * @example 'vendor/documents' or 'vendor/images'
   */
  folderPath?: string;
}
