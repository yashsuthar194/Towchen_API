import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderListDto } from './dto/order-list.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import { SendOrderOtpDto } from './dto/send-order-otp.dto';
import { VerifyOrderOtpDto } from './dto/verify-order-otp.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';

// ─────────────────────────────────────────────────────────────────────────────
// Order — General APIs (Create & Read)
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Order')
@Controller('order')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrderController {
  constructor(private readonly _orderService: OrderService) {}

  /**
   * Step 1: Create a new order with breakdown and drop locations.
   *
   * This is the first step in the order lifecycle. A customer (or admin)
   * creates an order by providing the service type, fleet type, and two
   * locations — breakdown (where the vehicle is stuck) and drop (where
   * it needs to be delivered).
   *
   * After creation, the order status is set to "New" and it becomes
   * visible to drivers for acceptance.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new towing/service order',
    description:
      '**Step 1 of Order Flow** — Creates a new order with status `New`.\n\n' +
      'Provide the customer ID, service type (Towing, Technician, etc.), fleet type ' +
      '(Flatbed, UnderLift, etc.), and both breakdown & drop location details.\n\n' +
      'The order is created atomically inside a transaction — if any step fails, ' +
      'everything is rolled back.\n\n' +
      '**Next step:** A driver accepts the order via `PATCH /order/:id/accept`.',
  })
  @ApiResponseDto(OrderDetailDto, false, 201)
  async create(@Body() createOrderDto: CreateOrderDto): Promise<ResponseDto<OrderDetailDto>> {
    const order = await this._orderService.createAsync(createOrderDto);
    return ResponseDto.created('Order created successfully', order);
  }

  /**
   * Get a paginated list of all orders (newest first).
   */
  @Get()
  @ApiOperation({
    summary: 'Get list of all orders',
    description:
      'Returns a list of all orders sorted by creation date (newest first).\n\n' +
      'Each item includes the order ID, formatted ID, customer ID, service type, ' +
      'fleet type, current status, and creation timestamp.\n\n' +
      'Use this to display an order dashboard or order history.',
  })
  @ApiResponseDto(OrderListDto, true, 200)
  async findAll(): Promise<ResponseDto<OrderListDto[]>> {
    const orders = await this._orderService.getListAsync();
    return ResponseDto.retrieved('Orders fetched successfully', orders);
  }

  /**
   * Get full details of a specific order by its ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get order details by ID',
    description:
      'Returns the complete details of a single order including:\n' +
      '- Customer info\n' +
      '- Assigned driver, vehicle, and vendor (if accepted)\n' +
      '- All linked locations (Breakdown, Drop, Start, End)\n' +
      '- Current status and timeline timestamps',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the order', example: 1 })
  @ApiResponseDto(OrderDetailDto, false, 200)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<OrderDetailDto>> {
    const order = await this._orderService.getByIdAsync(id);
    return ResponseDto.retrieved('Order details fetched successfully', order);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Order — Driver Actions (Accept, Send OTP, Verify OTP)
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Order - Driver Actions')
@Controller('order')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrderDriverController {
  constructor(private readonly _orderService: OrderService) {}

  /**
   * Step 2: Driver accepts a "New" order.
   *
   * When a driver accepts an order:
   * - The driver, vehicle, and vendor are assigned to the order.
   * - A START OTP is automatically generated and sent to the customer.
   * - The order status changes from "New" → "OtpPending".
   * - The driver's start/end locations are linked to the order.
   */
  @Patch(':id/accept')
  @ApiOperation({
    summary: 'Accept an order (Driver only)',
    description:
      '**Step 2 of Order Flow** — A driver accepts a `New` order.\n\n' +
      'This endpoint:\n' +
      '1. Assigns the driver, their vehicle, and vendor to the order\n' +
      '2. Auto-generates a 6-digit **START OTP** (valid for 10 minutes)\n' +
      '3. Links the driver\'s start and end locations to the order\n' +
      '4. Changes status from `New` → `OtpPending`\n' +
      '5. Records `assign_time`\n\n' +
      '⚠️ Only authenticated drivers can call this endpoint.\n\n' +
      '**Next step:** The driver collects the START OTP from the customer and ' +
      'verifies it via `POST /order/:id/verify-otp`.',
  })
  @ApiParam({ name: 'id', description: 'ID of the order to accept', example: 1 })
  @ApiResponseDto(OrderDetailDto, false, 200)
  async accept(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<OrderDetailDto>> {
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
      'Generates a new 6-digit OTP and sends it to the customer\'s phone number.\n\n' +
      '**Type `START`:** Use this to re-send the start OTP if the one auto-generated ' +
      'during acceptance has expired.\n\n' +
      '**Type `COMPLETE`:** Use this after the service is done. The driver requests a ' +
      'completion OTP which the customer will provide to confirm delivery.\n\n' +
      'OTP details:\n' +
      '- 6 digits, valid for 10 minutes\n' +
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
      '- OTP must not be expired (10-minute window)\n' +
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
}
