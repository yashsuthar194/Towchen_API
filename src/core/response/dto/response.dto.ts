import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

/**
 * Standard response wrapper for all API responses
 *
 * Success responses: Manually created by developers with custom messages
 * Error responses: Automatically created by exception filter
 */
export class ResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  is_success: boolean;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  status: number;

  @ApiProperty({
    description: 'HTTP status message',
    example: 'OK',
  })
  status_message: string;

  @ApiProperty({
    description: 'Human-readable message describing the result',
    example: 'Success',
  })
  message: string;

  @ApiProperty({
    description: 'Response payload data',
  })
  data: T;

  constructor(
    isSuccess: boolean,
    status: number,
    message: string,
    data: T = null as T,
  ) {
    this.is_success = isSuccess;
    this.status = status;
    this.status_message = this.getStatusMessage(status);
    this.message = message;
    this.data = data;
  }

  private getStatusMessage(status: number): string {
    const messages: Record<number, string> = {
      200: 'OK',
      201: 'CREATED',
      204: 'NO_CONTENT',
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return messages[status] || 'UNKNOWN';
  }

  // ============================================
  // Helper Methods for Success Responses
  // ============================================

  /**
   * Create a successful response
   *
   * @param message - Custom success message
   * @param data - Response data
   * @param status - HTTP status code (default 200)
   *
   * @example
   * return ResponseDto.success('User created successfully', userData, 201);
   */
  static success<T>(
    message: string,
    data: T = null as T,
    status: number = HttpStatus.OK,
  ): ResponseDto<T> {
    return new ResponseDto(true, status, message, data);
  }

  /**
   * Data retrieved successfully (GET requests)
   *
   * @example
   * return ResponseDto.retrieved('Vendors fetched successfully', vendors);
   */
  static retrieved<T>(message: string, data: T): ResponseDto<T> {
    return ResponseDto.success(message, data, HttpStatus.OK);
  }

  /**
   * Resource created successfully (POST requests)
   *
   * @example
   * return ResponseDto.created('Vendor created successfully', vendor);
   */
  static created<T>(message: string, data: T): ResponseDto<T> {
    return ResponseDto.success(message, data, HttpStatus.CREATED);
  }

  /**
   * Resource updated successfully (PUT/PATCH requests)
   *
   * @example
   * return ResponseDto.updated('Vendor updated successfully', vendor);
   */
  static updated<T>(message: string, data: T): ResponseDto<T> {
    return ResponseDto.success(message, data, HttpStatus.OK);
  }

  /**
   * Resource deleted successfully (DELETE requests)
   *
   * @example
   * return ResponseDto.deleted('Vendor deleted successfully');
   */
  static deleted(message: string): ResponseDto<null> {
    return ResponseDto.success(message, null, HttpStatus.OK);
  }

  // ============================================
  // Error Methods (Used by Exception Filter)
  // ============================================

  /**
   * Create an error response
   * Used internally by the exception filter
   * Developers should throw exceptions instead of calling this directly
   *
   * @param message - Error message
   * @param status - HTTP status code
   * @param data - Additional error data (optional)
   */
  static error<T = null>(
    message: string,
    status: number = HttpStatus.INTERNAL_SERVER_ERROR,
    data: T = null as T,
  ): ResponseDto<T> {
    return new ResponseDto(false, status, message, data);
  }
}
