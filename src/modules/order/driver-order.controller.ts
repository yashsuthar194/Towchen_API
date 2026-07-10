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
import { UploadPhysicalVcrfDto } from './dto/upload-physical-vcrf.dto';
import { FileHelper } from 'src/shared/helper/file-helper';
import { EVCRFService } from '../evcrf/evcrf.service';
import { SubmitPickupEvcrfDto } from '../evcrf/dto/submit-pickup-evcrf.dto';
import { SubmitDropoffEvcrfDto } from '../evcrf/dto/submit-dropoff-evcrf.dto';
import { EvcrfConfigResponseDto } from '../evcrf/dto/evcrf-config-response.dto';
import { EvcrfPrefillResponseDto } from '../evcrf/dto/evcrf-prefill-response.dto';
import { CallerService } from 'src/services/jwt/caller.service';
import { VehicleClassMappingService } from '../vehicle-class-mapping/vehicle-class-mapping.service';
import { AddDamageDto } from '../evcrf/dto/add-damage.dto';

@ApiTags('Driver - Order')
@Controller('driver/order')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DriverOrderController {
  constructor(
    private readonly _orderService: OrderService,
    private readonly _evcrfService: EVCRFService,
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
   * Upload multiple dropoff images for an order.
   */
  @Put(':id/dropoff-images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadOrderImagesDto })
  @ApiOperation({
    summary: 'Upload dropoff images for an order (Driver only)',
    description:
      'Allows the assigned driver to upload multiple dropoff images via formdata.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order', example: 1 })
  @UseInterceptors(
    FilesInterceptor('files', 10, { fileFilter: FileHelper.imageFilter }),
  )
  async uploadDropoffImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<{ urls: string[] }>> {
    const result = await this._orderService.uploadOrderImagesAsync(
      id,
      'dropoff',
      files,
    );
    return ResponseDto.updated(
      'Dropoff images uploaded successfully',
      result,
    );
  }

  /**
   * Upload physical pickup VCRF image for an order (when e-VCRF is false).
   */
  @Put(':id/physical-pickup-vcrf')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPhysicalVcrfDto })
  @ApiOperation({
    summary: 'Upload physical pickup VCRF image for an order (Driver only)',
    description:
      'Allows the assigned driver to upload a physical VCRF image via formdata when e-VCRF is false.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order', example: 1 })
  @UseInterceptors(
    FileInterceptor('file', { fileFilter: FileHelper.imageFilter }),
  )
  async uploadPhysicalPickupVcrf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    const result = await this._orderService.uploadPhysicalVcrfImageAsync(
      id,
      'pickup',
      file,
    );
    return ResponseDto.updated(
      'Physical pickup VCRF image uploaded successfully',
      result,
    );
  }

  /**
   * Upload physical dropoff VCRF image for an order (when e-VCRF is false).
   */
  @Put(':id/physical-dropoff-vcrf')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPhysicalVcrfDto })
  @ApiOperation({
    summary:
      'Upload physical dropoff VCRF image for an order (Driver only)',
    description:
      'Allows the assigned driver to upload a physical VCRF image via formdata when e-VCRF is false.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order', example: 1 })
  @UseInterceptors(
    FileInterceptor('file', { fileFilter: FileHelper.imageFilter }),
  )
  async uploadPhysicalDropoffVcrf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseDto<{ url: string }>> {
    const result = await this._orderService.uploadPhysicalVcrfImageAsync(
      id,
      'dropoff',
      file,
    );
    return ResponseDto.updated(
      'Physical dropoff VCRF image uploaded successfully',
      result,
    );
  }

  /**
   * Submit EVCRF for order pickup.
   */
  @Post(':id/evcrf/pickup')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit EVCRF for pickup (Driver only)',
    description: 'Allows the assigned driver to submit EVCRF details during pickup.',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'odometer_image', maxCount: 1 },
      { name: 'driver_image', maxCount: 1 },
      { name: 'driver_sign', maxCount: 1 },
    ], { fileFilter: FileHelper.imageFilter })
  )
  async submitPickupEvcrf(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitPickupEvcrfDto,
    @UploadedFiles() files: { 
      odometer_image?: Express.Multer.File[]; 
      driver_image?: Express.Multer.File[]; 
      driver_sign?: Express.Multer.File[]; 
    },
  ) {
    const driverId = this._callerService.getUserId();
    const result = await this._evcrfService.submitPickupEvcrfAsync(id, driverId, dto, files);
    return ResponseDto.created('Pickup EVCRF submitted successfully', result);
  }

  /**
   * Get EVCRF for order pickup.
   */
  @Get(':id/evcrf/pickup')
  @ApiOperation({
    summary: 'Get EVCRF for pickup (Driver only)',
    description: 'Allows retrieving the submitted pickup EVCRF details.',
  })
  async getPickupEvcrf(@Param('id', ParseIntPipe) id: number) {
    const result = await this._evcrfService.getPickupEvcrfAsync(id);
    return ResponseDto.retrieved('Pickup EVCRF details retrieved successfully', result);
  }

  /**
   * Submit EVCRF for order dropoff.
   */
  @Post(':id/evcrf/dropoff')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit EVCRF for dropoff (Driver only)',
    description: 'Allows the assigned driver to submit EVCRF details during dropoff.',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'handover_image', maxCount: 1 },
      { name: 'handover_signature', maxCount: 1 },
    ], { fileFilter: FileHelper.imageFilter })
  )
  async submitDropoffEvcrf(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitDropoffEvcrfDto,
    @UploadedFiles() files: { 
      handover_image?: Express.Multer.File[]; 
      handover_signature?: Express.Multer.File[]; 
    },
  ) {
    const driverId = this._callerService.getUserId();
    const result = await this._evcrfService.submitDropoffEvcrfAsync(id, driverId, dto, files);
    return ResponseDto.created('Dropoff EVCRF submitted successfully', result);
  }

  /**
   * Get EVCRF for order dropoff.
   */
  @Get(':id/evcrf/dropoff')
  @ApiOperation({
    summary: 'Get EVCRF for dropoff (Driver only)',
    description: 'Allows retrieving the submitted dropoff EVCRF details.',
  })
  async getDropoffEvcrf(@Param('id', ParseIntPipe) id: number) {
    const result = await this._evcrfService.getDropoffEvcrfAsync(id);
    return ResponseDto.retrieved('Dropoff EVCRF details retrieved successfully', result);
  }

  @Get(':id/evcrf/config')
  @ApiOperation({
    summary: 'Get EVCRF configuration for order (Driver only)',
    description: 'Resolves the vehicle class and retrieves the diagram details, total damage points, and order details for pre-filling the EVCRF form.',
  })
  @ApiResponseDto(EvcrfConfigResponseDto, false, 200)
  async getEvcrfConfiguration(@Param('id', ParseIntPipe) id: number) {
    const result = await this._evcrfService.getEvcrfConfigurationAsync(id);
    return ResponseDto.retrieved('EVCRF configuration retrieved successfully', result);
  }

  /**
   * Get EVCRF pre-fill data for an order.
   */
  @Get(':id/evcrf/prefill-data')
  @ApiOperation({
    summary: 'Get EVCRF pre-fill data for order (Driver only)',
    description: 'Retrieves specific order details (e.g. driver name, vehicle no) to pre-fill the EVCRF form fields.',
  })
  @ApiResponseDto(EvcrfPrefillResponseDto, false, 200)
  async getEvcrfPrefillData(@Param('id', ParseIntPipe) id: number) {
    const result = await this._evcrfService.getEvcrfPrefillDataAsync(id);
    return ResponseDto.retrieved('EVCRF prefill data retrieved successfully', result);
  }

  /**
   * Get EVCRF configuration (diagram image, mapped class, points) based on sub_class.
   */
  @Get('vehicle-class-config/:subClass')
  @ApiOperation({
    summary: 'Get EVCRF configuration by sub-class (Driver only)',
    description: 'Retrieves the diagram details and total damage points based on the provided sub-class string (e.g. LMV, SUV).',
  })
  async getVehicleClassConfigBySubClass(@Param('subClass') subClass: string) {
    const result = await this._vehicleClassMappingService.getConfigBySubClassAsync(subClass);
    return ResponseDto.retrieved('Vehicle class configuration retrieved successfully', result);
  }

  /**
   * Add damage to a pickup E-Job Card.
   */
  @Post('e-job-card/:jobCardId/damage')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Add damage to pickup E-Job Card (Driver only)',
    description: 'Adds a damage record (damage number and image file) to an existing pickup E-Job Card via formdata.',
  })
  @ApiParam({ name: 'jobCardId', description: 'ID of the pickup E-Job Card', example: 1 })
  @UseInterceptors(
    FileInterceptor('damage_image', { fileFilter: FileHelper.imageFilter }),
  )
  async addDamage(
    @Param('jobCardId', ParseIntPipe) jobCardId: number,
    @Body() dto: AddDamageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this._evcrfService.addDamageAsync(jobCardId, dto, file);
    return ResponseDto.created('Damage added successfully', result);
  }
}
