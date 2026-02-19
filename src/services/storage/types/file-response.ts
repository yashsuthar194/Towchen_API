/**
 * Data Transfer Object for file operation responses
 * Represents the result of a successful file storage operation
 */
export class FileResponseDto {
  /**
   * Unique identifier/key for the stored file
   * Used for retrieving, updating, or deleting the file
   */
  fileKey: string;

  /**
   * Public URL to access the file
   * May be a direct URL or a signed URL depending on storage configuration
   */
  url: string;

  /**
   * Original filename as provided during upload
   */
  fileName: string;

  /**
   * MIME type of the stored file
   */
  mimeType: string;

  /**
   * Size of the file in bytes
   */
  size: number;

  /**
   * Timestamp when the file was uploaded
   */
  uploadedAt: Date;
}
