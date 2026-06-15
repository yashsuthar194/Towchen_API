import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { SendOrderOtpDto } from './dto/send-order-otp.dto';
import { VerifyOrderOtpDto } from './dto/verify-order-otp.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { FilesInterceptor, FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadOrderImagesDto } from './dto/upload-order-images.dto';
import { UploadPhysicalJobCardDto } from './dto/upload-physical-job-card.dto';
import { FileHelper } from 'src/shared/helper/file-helper';
import { EJobCardService } from '../e-job-card/e-job-card.service';
import { SubmitPickupJobCardDto } from '../e-job-card/dto/submit-pickup-job-card.dto';
import { CallerService } from 'src/services/jwt/caller.service';
import { VehicleClassMappingService } from '../vehicle-class-mapping/vehicle-class-mapping.service';

@ApiTags('Driver - Order')
@Controller('driver/order')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DriverOrderController {
  constructor(
    private readonly _orderService: OrderService,
    private readonly _eJobCardService: EJobCardService,
    private readonly _callerService: CallerService,
    private readonly _vehicleClassMappingService: VehicleClassMappingService,
  ) {}

  /**
   * List all pending (New/unassigned) orders in the system.
   */
  @Get('pending')
  @ApiOperation({
    summary: 'List all pending orders (Driver only)',
    description:
      'Returns a list of all orders with status `New` (unassigned) available in the system.\n\n' +
      '⚠️ Only authenticated drivers can call this endpoint.',
  })
  @ApiResponseDto(OrderDetailDto, true, 200)
  async getPending(): Promise<ResponseDto<OrderDetailDto[]>> {
    const orders = await this._orderService.getPendingOrdersForDriverAsync();
    return ResponseDto.retrieved('Pending orders fetched successfully', orders);
  }

  /**
   * Get full details of a specific order by its ID (Driver only).
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get order details by ID (Driver only)',
    description:
      'Returns the complete details of a single order by its ID, if it is pending or assigned to this driver.\n\n' +
      '⚠️ Only authenticated drivers can call this endpoint.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the order', example: 1 })
  @ApiResponseDto(OrderDetailDto, false, 200)
  async getById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<OrderDetailDto>> {
    const order = await this._orderService.getOrderByIdForDriverAsync(id);
    return ResponseDto.retrieved('Order details fetched successfully', order);
  }

  /**
   * Step 2: Driver accepts a "New" order.
   *
   * When a driver accepts an order:
   * - The driver, vehicle, and vendor are assigned to the order.
   * - A START OTP is automatically generated and sent to the customer.
   * - The order status changes from "New" → "OtpPending".
   * - The driver's start/end locations are linked to the order.
   */
  @Put(':id/accept')
  @ApiOperation({
    summary: 'Accept an order (Driver only)',
    description:
      '**Step 2 of Order Flow** — A driver accepts a `New` order.\n\n' +
      'This endpoint:\n' +
      '1. Assigns the driver, their vehicle, and vendor to the order\n' +
      '2. Auto-generates a 6-digit **START OTP**\n' +
      "3. Links the driver's start and end locations to the order\n" +
      '4. Changes status from `New` → `OtpPending`\n' +
      '5. Records `assign_time`\n\n' +
      '⚠️ Only authenticated drivers can call this endpoint.\n\n' +
      '**Next step:** The driver collects the START OTP from the customer and ' +
      'verifies it via `POST /driver/order/:id/verify-otp`.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the order to accept',
    example: 1,
  })
  @ApiResponseDto(OrderDetailDto, false, 200)
  async accept(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<OrderDetailDto>> {
    const order = await this._orderService.acceptOrderAsync(id);
    return ResponseDto.updated('Order accepted successfully', order);
  }

  /**
   * Step 3 (optional) / Step 4: Request an OTP for starting or completing an order.
   *
   * - Type "START": Re-sends the start OTP (in case the auto-generated one expired).
   * - Type "COMPLETE": Generates a new OTP for order completion.
   *
   * The OTP is sent to the customer's registered phone number.
   */
  @Post(':id/send-otp')
  @ApiOperation({
    summary: 'Request an OTP for order start or completion (Driver only)',
    description:
      '**Step 3 (for COMPLETE) or Re-send (for START)**\n\n' +
      "Generates a new 6-digit OTP and sends it to the customer's phone number.\n\n" +
      '**Type `START`:** Use this to re-send the start OTP if the one auto-generated ' +
      'during acceptance has expired.\n\n' +
      '**Type `COMPLETE`:** Use this after the service is done. The driver requests a ' +
      'completion OTP which the customer will provide to confirm delivery.\n\n' +
      'OTP details:\n' +
      '- 6 digits\n' +
      '- Replaces any existing OTP of the same type for this order\n' +
      '- Status is set to `OtpPending`\n\n' +
      '⚠️ Only the assigned driver for this order can call this endpoint.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order', example: 1 })
  async sendOtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendOrderOtpDto,
  ): Promise<{ message: string }> {
    return await this._orderService.sendOrderOtpAsync(id, dto.type);
  }

  /**
   * Step 3 (START) / Step 5 (COMPLETE): Verify OTP and advance order status.
   *
   * - Verifying a START OTP: status changes to "InProgress", start_time is recorded.
   * - Verifying a COMPLETE OTP: status changes to "Completed", completion_time is recorded.
   */
  @Post(':id/verify-otp')
  @ApiOperation({
    summary: 'Verify an order OTP and update status (Driver only)',
    description:
      '**Step 3 (START verification) / Step 5 (COMPLETE verification)**\n\n' +
      'The driver enters the 6-digit OTP collected from the customer in-person.\n\n' +
      '**For `START` OTP:**\n' +
      '- Status changes: `OtpPending` → `InProgress`\n' +
      '- `start_time` is recorded on the order\n\n' +
      '**For `COMPLETE` OTP:**\n' +
      '- Status changes: `OtpPending` → `Completed`\n' +
      '- `completion_time` is recorded on the order\n\n' +
      'Validation rules:\n' +
      '- OTP must be valid\n' +
      '- OTP must not have been already verified\n' +
      '- Wrong OTP increments the `attempts` counter\n\n' +
      '⚠️ Only the assigned driver for this order can call this endpoint.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order', example: 1 })
  async verifyOtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyOrderOtpDto,
  ): Promise<{ message: string }> {
    return await this._orderService.verifyOrderOtpAsync(id, dto.type, dto.otp);
  }

  /**
   * Cancel an order (Driver only).
   * Resets status back to 'New' and unassigns the driver.
   */
  @Put(':id/cancel')
  @ApiOperation({
    summary: 'Cancel an assigned/active order (Driver only)',
    description:
      'Resets the order status back to `New` and unassigns the driver, vehicle, ' +
      'vendor, and driver start/end locations from the order so another driver can accept it.\n\n' +
      '⚠️ Only the assigned driver for this order can call this endpoint.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the order to cancel',
    example: 1,
  })
  @ApiResponseDto(OrderDetailDto, false, 200)
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelOrderDto,
  ): Promise<ResponseDto<OrderDetailDto>> {
    const order = await this._orderService.cancelOrderAsync(id, dto.reason);
    return ResponseDto.updated('Order cancelled successfully', order);
  }

  /**
   * Upload multiple pre-pickup images for an order.
   */
  @Put(':id/pre-pickup-images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadOrderImagesDto })
  @ApiOperation({
    summary: 'Upload pre-pickup images for an order (Driver only)',
    description:
      'Allows the assigned driver to upload multiple pre-pickup images via formdata.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order', example: 1 })
  @UseInterceptors(
    FilesInterceptor('files', 10, { fileFilter: FileHelper.imageFilter }),
  )
  async uploadPrePickupImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._orderService.uploadOrderImagesAsync(
      id,
      'pre_pickup',
      files,
    );
    return ResponseDto.updated(
      'Pre-pickup images uploaded successfully',
      result,
    );
  }

  /**
   * Upload multiple post-pickup/delivery images for an order.
   */
  @Put(':id/post-pickup-images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadOrderImagesDto })
  @ApiOperation({
    summary: 'Upload post-pickup images for an order (Driver only)',
    description:
      'Allows the assigned driver to upload multiple post-pickup images via formdata.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order', example: 1 })
  @UseInterceptors(
    FilesInterceptor('files', 10, { fileFilter: FileHelper.imageFilter }),
  )
  async uploadPostPickupImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._orderService.uploadOrderImagesAsync(
      id,
      'post_pickup',
      files,
    );
    return ResponseDto.updated(
      'Post-pickup images uploaded successfully',
      result,
    );
  }

  /**
   * Upload physical pickup job card image for an order (when e-job card is false).
   */
  @Put(':id/physical-pickup-job-card')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPhysicalJobCardDto })
  @ApiOperation({
    summary: 'Upload physical pickup job card image for an order (Driver only)',
    description:
      'Allows the assigned driver to upload a physical job card image via formdata when e-job card is false.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order', example: 1 })
  @UseInterceptors(
    FileInterceptor('file', { fileFilter: FileHelper.imageFilter }),
  )
  async uploadPhysicalPickupJobCard(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    const result = await this._orderService.uploadPhysicalJobCardImageAsync(
      id,
      'pickup',
      file,
    );
    return ResponseDto.updated(
      'Physical pickup job card image uploaded successfully',
      result,
    );
  }

  /**
   * Upload physical dropoff job card image for an order (when e-job card is false).
   */
  @Put(':id/physical-dropoff-job-card')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPhysicalJobCardDto })
  @ApiOperation({
    summary:
      'Upload physical dropoff job card image for an order (Driver only)',
    description:
      'Allows the assigned driver to upload a physical job card image via formdata when e-job card is false.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order', example: 1 })
  @UseInterceptors(
    FileInterceptor('file', { fileFilter: FileHelper.imageFilter }),
  )
  async uploadPhysicalDropoffJobCard(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    const result = await this._orderService.uploadPhysicalJobCardImageAsync(
      id,
      'dropoff',
      file,
    );
    return ResponseDto.updated(
      'Physical dropoff job card image uploaded successfully',
      result,
    );
  }

  /**
   * Submit E-Job Card for order pickup.
   */
  @Post(':id/e-job-card/pickup')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit E-Job Card for pickup (Driver only)',
    description: 'Allows the assigned driver to submit E-Job Card details during pickup.',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'odometer_image', maxCount: 1 },
      { name: 'driver_image', maxCount: 1 },
      { name: 'driver_sign', maxCount: 1 },
      { name: 'damage_images', maxCount: 30 },
    ], { fileFilter: FileHelper.imageFilter })
  )
  async submitPickupJobCard(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitPickupJobCardDto,
    @UploadedFiles() files: { 
      odometer_image?: Express.Multer.File[]; 
      driver_image?: Express.Multer.File[]; 
      driver_sign?: Express.Multer.File[]; 
      damage_images?: Express.Multer.File[] 
    },
  ) {
    const driverId = this._callerService.getUserId();
    const result = await this._eJobCardService.submitPickupJobCardAsync(id, driverId, dto, files);
    return ResponseDto.created('Pickup E-Job Card submitted successfully', result);
  }

  /**
   * Get E-Job Card for order pickup.
   */
  @Get(':id/e-job-card/pickup')
  @ApiOperation({
    summary: 'Get E-Job Card for pickup (Driver only)',
    description: 'Allows retrieving the submitted pickup E-Job Card details.',
  })
  async getPickupJobCard(@Param('id', ParseIntPipe) id: number) {
    const result = await this._eJobCardService.getPickupJobCardAsync(id);
    return ResponseDto.retrieved('Pickup E-Job Card details retrieved successfully', result);
  }

  /**
   * Get E-Job Card configuration (diagram image, mapped class, points) for an order.
   */
  @Get(':id/e-job-card/config')
  @ApiOperation({
    summary: 'Get E-Job Card configuration for order (Driver only)',
    description: 'Resolves the vehicle class and retrieves the diagram details and total damage points.',
  })
  async getJobCardConfiguration(@Param('id', ParseIntPipe) id: number) {
    const result = await this._eJobCardService.getJobCardConfigurationAsync(id);
    return ResponseDto.retrieved('E-Job Card configuration retrieved successfully', result);
  }

  /**
   * Get E-Job Card configuration (diagram image, mapped class, points) based on sub_class.
   */
  @Get('vehicle-class-config/:subClass')
  @ApiOperation({
    summary: 'Get E-Job Card configuration by sub-class (Driver only)',
    description: 'Retrieves the diagram details and total damage points based on the provided sub-class string (e.g. LMV, SUV).',
  })
  async getVehicleClassConfigBySubClass(@Param('subClass') subClass: string) {
    const result = await this._vehicleClassMappingService.getConfigBySubClassAsync(subClass);
    return ResponseDto.retrieved('Vehicle class configuration retrieved successfully', result);
  }
}
