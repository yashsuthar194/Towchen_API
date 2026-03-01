import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ResponseDto } from '../dto/response.dto';

/**
 * Swagger decorator for ResponseDto with typed data
 * Helps Swagger understand the generic ResponseDto<T> structure
 *
 * @param dataType - The DTO class for the data property
 * @param isArray - Whether data is an array
 * @param status - HTTP status code
 *
 * @example
 * @ApiResponseDto(VendorListDto, true, 200)
 * async getList(): Promise<ResponseDto<VendorListDto[]>> { ... }
 */
export function ApiResponseDto<TModel extends Type<any>>(
  dataType: TModel,
  isArray: boolean = false,
  status: number = 200,
) {
  return applyDecorators(
    ApiExtraModels(ResponseDto, dataType),
    ApiResponse({
      status,
      schema: {
        allOf: [
          {
            properties: {
              is_success: {
                type: 'boolean',
                example: true,
              },
              status: {
                type: 'number',
                example: status,
              },
              status_message: {
                type: 'string',
                example: 'OK',
              },
              message: {
                type: 'string',
                example: 'Operation completed successfully',
              },
              data: isArray
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(dataType) },
                  }
                : {
                    $ref: getSchemaPath(dataType),
                  },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Swagger decorator for ResponseDto with null data (e.g., delete operations)
 *
 * @param status - HTTP status code
 *
 * @example
 * @ApiResponseDtoNull(200)
 * async delete(): Promise<ResponseDto<null>> { ... }
 */
export function ApiResponseDtoNull(status: number = 200) {
  return applyDecorators(
    ApiExtraModels(ResponseDto),
    ApiResponse({
      status,
      schema: {
        properties: {
          is_success: {
            type: 'boolean',
            example: true,
          },
          status: {
            type: 'number',
            example: status,
          },
          status_message: {
            type: 'string',
            example: 'OK',
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
          data: {
            type: 'null',
            example: null,
          },
        },
      },
    }),
  );
}
