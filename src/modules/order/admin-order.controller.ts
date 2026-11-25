import {
  Controller,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { AdminOrderFilterDto } from './dto/admin-order-filter.dto';
import {
  PaginatedOrderListResponseDto,
  OrderListItemDto,
} from './dto/order-list-response.dto';
import { ReassignOrderDriverDto } from './dto/reassign-order-driver.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { AdminGuard } from 'src/services/jwt/guards/admin.guard';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';

@ApiTags('Admin - Order')
@Controller('admin/order')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminOrderController {
  constructor(private readonly _orderService: OrderService) {}

  /**
   * POST /admin/order/list
   * Returns a paginated list of all orders with comprehensive filtering options.
   */
  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get paginated list of orders with filters (Admin only)',
    description:
      'Provides a flexible, filterable order list for the Admin Dashboard.\n\n' +
      'Supports filtering by:\n' +
      '- `status` (single OrderStatus value, e.g. New, Assigned, InProgress, etc.)\n' +
      '- `type` (single OrderType: Standard, Scheduled, Package, Sample)\n' +
      '- `vendor_id`, `driver_id`, `customer_id`, `vehicle_id`\n' +
      '- `service_id`, `sub_service_id`\n' +
      '- Date range (`start_date`, `end_date`, `date_filter_by`)\n' +
      '- Location (`city`, `state`, `pincode`)\n' +
      '- Financial range (`min_amount`, `max_amount`, `has_voucher`)\n' +
      '- Disputes (`has_dispute`)\n' +
      '- Universal text `search` (order ID, customer, driver, vehicle reg, address)\n' +
      '- Sorted automatically by latest order (`id: desc`)\n' +
      '- Pagination (`page`, optional `limit` defaulting to 30)',
  })
  @ApiResponseDto(PaginatedOrderListResponseDto, false, 200)
  async getOrderList(
    @Body() filterDto: AdminOrderFilterDto,
  ): Promise<ResponseDto<PaginatedOrderListResponseDto>> {
    const result = await this._orderService.getAdminOrderListAsync(filterDto);
    return ResponseDto.retrieved('Orders retrieved successfully', result);
  }

  /**
   * POST /admin/order
   * Alias for POST /admin/order/list for RESTful compatibility.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alias: Get paginated list of orders with filters (Admin only)',
  })
  @ApiResponseDto(PaginatedOrderListResponseDto, false, 200)
  async getOrderListAlias(
    @Body() filterDto: AdminOrderFilterDto,
  ): Promise<ResponseDto<PaginatedOrderListResponseDto>> {
    return this.getOrderList(filterDto);
  }

  /**
   * PATCH /admin/order/:id/reassign
   * Manually re-assigns vendor and driver for a scheduled or assigned order.
   */
  @Patch(':id/reassign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually re-assign vendor and driver for an order (Admin only)',
    description:
      'Allows an administrator to manually re-assign the vendor and driver for an order.\n\n' +
      'Validates that:\n' +
      '- Order is in Scheduled, Assigned, or New status\n' +
      '- Driver belongs to the specified vendor\n' +
      '- Driver has no overlapping scheduled orders or blackout window conflicts\n' +
      '- Appends an audit remark with the reason',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the order to reassign', example: 105 })
  @ApiResponseDto(OrderListItemDto, false, 200)
  async reassignOrderDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReassignOrderDriverDto,
    @Req() req: any,
  ): Promise<ResponseDto<OrderListItemDto>> {
    const adminId = req.user?.id;
    const updated = await this._orderService.adminReassignOrderDriverAsync(id, dto, adminId);
    return ResponseDto.updated('Order driver re-assigned successfully', updated);
  }
}
