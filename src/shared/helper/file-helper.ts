import { BadRequestException } from '@nestjs/common';

/**
 * Helper class for file-related operations and validations.
 */
export class FileHelper {
  /**
   * Filter for images only (JPG, JPEG, PNG)
   */
  static imageFilter(req: any, file: Express.Multer.File, callback: (error: any, acceptFile: boolean) => void) {
    if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      return callback(new BadRequestException('Only JPG, JPEG and PNG images are allowed!'), false);
    }
    callback(null, true);
  }

  /**
   * Filter for documents only (PDF, DOC, DOCX)
   */
  static documentFilter(req: any, file: Express.Multer.File, callback: (error: any, acceptFile: boolean) => void) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new BadRequestException('Only documents (PDF, DOC, DOCX) are allowed!'), false);
    }
    callback(null, true);
  }
}
