import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { VendorOrderFilterDto } from './dto/vendor-order-filter.dto';
import {
  PaginatedOrderListResponseDto,
  OrderListItemDto,
} from './dto/order-list-response.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';
import { CallerService } from 'src/services/jwt/caller.service';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';

@ApiTags('Vendor - Order')
@Controller('vendor/order')
@UseGuards(JwtAuthGuard, VendorGuard)
@ApiBearerAuth('JWT-auth')
export class VendorOrderController {
  constructor(
    private readonly _orderService: OrderService,
    private readonly _callerService: CallerService,
  ) {}

  /**
   * GET /vendor/order/scheduled
   * Returns list of scheduled orders assigned to the authenticated vendor fleet.
   */
  @Get('scheduled')
  @ApiOperation({
    summary: 'Get list of scheduled orders assigned to this vendor fleet',
    description:
      'Returns all upcoming scheduled orders assigned to the logged-in vendor, sorted ascending by scheduled execution time.\n\n' +
      '⚠️ Automatically scoped to the authenticated vendor.',
  })
  @ApiResponseDto(OrderListItemDto, true, 200)
  async getScheduledOrders(@Req() req: any): Promise<ResponseDto<OrderListItemDto[]>> {
    const vendorId = req.user?.id || this._callerService.getUserId();
    const orders = await this._orderService.getVendorScheduledOrdersAsync(vendorId);
    return ResponseDto.retrieved('Vendor scheduled orders retrieved successfully', orders);
  }

  /**
   * POST /vendor/order/list
   * Returns a paginated list of orders scoped strictly to the authenticated vendor.
   */
  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated list of vendor orders with filters (Vendor only)',
    description:
      'Provides a flexible, filterable order list for the Vendor Portal.\n\n' +
      '**Security Note:** Automatically scoped to the authenticated vendor.\n' +
      'A vendor can never see another vendor\'s orders.\n\n' +
      'Supports filtering by:\n' +
      '- `status` (single OrderStatus value, e.g. New, Assigned, InProgress, etc.)\n' +
      '- `type` (single OrderType: Standard, Scheduled, Package, Sample)\n' +
      '- `driver_id` (filtered to vendor\'s own drivers)\n' +
      '- `vehicle_id` (filtered to vendor\'s own fleet)\n' +
      '- `service_id`, `sub_service_id`\n' +
      '- Date range (`start_date`, `end_date`, `date_filter_by`)\n' +
      '- Location (`city`, `state`, `pincode`)\n' +
      '- Financial range (`min_amount`, `max_amount`)\n' +
      '- Disputes (`has_dispute`)\n' +
      '- Universal text `search` (order ID, customer, driver, vehicle reg, address)\n' +
      '- Sorted automatically by latest order (`id: desc`)\n' +
      '- Pagination (`page`, optional `limit` defaulting to 30)',
  })
  @ApiResponseDto(PaginatedOrderListResponseDto, false, 200)
  async getOrderList(
    @Req() req: any,
    @Body() filterDto: VendorOrderFilterDto,
  ): Promise<ResponseDto<PaginatedOrderListResponseDto>> {
    const vendorId = req.user?.id || this._callerService.getUserId();
    const result = await this._orderService.getVendorOrderListAsync(
      vendorId,
      filterDto,
    );
    return ResponseDto.retrieved('Vendor orders retrieved successfully', result);
  }

  /**
   * POST /vendor/order
   * Alias for POST /vendor/order/list for RESTful compatibility.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alias: Get paginated list of vendor orders with filters (Vendor only)',
  })
  @ApiResponseDto(PaginatedOrderListResponseDto, false, 200)
  async getOrderListAlias(
    @Req() req: any,
    @Body() filterDto: VendorOrderFilterDto,
  ): Promise<ResponseDto<PaginatedOrderListResponseDto>> {
    return this.getOrderList(req, filterDto);
  }
}
