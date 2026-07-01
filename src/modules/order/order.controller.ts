import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderListDto } from './dto/order-list.dto';
import { OrderDetailDto, OrderOtpDetailDto } from './dto/order-detail.dto';
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

  /**
   * Get OTPs for a specific order (For Customers)
   */
  @Get(':id/otp')
  @ApiOperation({
    summary: 'Get order OTPs by ID (Customer only)',
    description:
      'Returns the OTPs for a given order.\n' +
      'Only the customer who created the order can access its OTPs.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the order', example: 1 })
  @ApiResponseDto(OrderOtpDetailDto, true, 200)
  async getOrderOtps(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<OrderOtpDetailDto[]>> {
    const otps = await this._orderService.getOrderOtpsAsync(id);
    return ResponseDto.retrieved('Order OTPs fetched successfully', otps);
  }
}

