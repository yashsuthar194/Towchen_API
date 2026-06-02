import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { OrderService } from './order.service';
import { CreateOrderV2Dto } from './dto/create-order-v2.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDetailDto } from './dto/order-detail.dto';

@ApiTags('Order V2')
@Controller('v2/order')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrderV2Controller {
  constructor(private readonly _orderService: OrderService) {}

  /**
   * Create a new towing/service order (V2).
   *
   * This API allows clients to send flat location fields directly in the root
   * object instead of nested location objects.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new towing/service order (V2 Flat Input)',
    description:
      '**Step 1 of Order Flow (V2)** — Creates a new order with status `New`.\n\n' +
      'This V2 endpoint allows passing `breakdown_place_id` and `dropoff_place_id` ' +
      'at the root level without nested objects, making it simpler to consume.\n\n' +
      'The order is created atomically inside a transaction — if any step fails, ' +
      'everything is rolled back.',
  })
  @ApiResponseDto(OrderDetailDto, false, 201)
  async create(
    @Body() createOrderV2Dto: CreateOrderV2Dto,
  ): Promise<ResponseDto<OrderDetailDto>> {
    // Map V2 DTO to the original CreateOrderDto structure
    const createOrderDto: CreateOrderDto = {
      customer_vehicle_id: createOrderV2Dto.customer_vehicle_id,
      service_id: createOrderV2Dto.service_id,
      sub_service_id: createOrderV2Dto.sub_service_id,
      breakdown_location: {
        place_id: createOrderV2Dto.breakdown_place_id,
      },
      drop_location: createOrderV2Dto.dropoff_place_id
        ? { place_id: createOrderV2Dto.dropoff_place_id }
        : undefined,
      breakdown_contact_name: createOrderV2Dto.breakdown_contact_name,
      breakdown_contact_number: createOrderV2Dto.breakdown_contact_number,
      drop_contact_name: createOrderV2Dto.drop_contact_name,
      drop_contact_number: createOrderV2Dto.drop_contact_number,
      voucher_code: createOrderV2Dto.voucher_code,
      sub_service_estimate: createOrderV2Dto.name ? {
        id: createOrderV2Dto.sub_service_id,
        name: createOrderV2Dto.name,
        ton: createOrderV2Dto.ton,
        journey_type: createOrderV2Dto.journey_type,
        
        // Re-map the flat `_int` and `_string` fields to their names matching the updated PricedSubServiceDto
        base_distance_int: createOrderV2Dto.base_distance_int,
        base_rate_string: createOrderV2Dto.base_rate_string,
        base_rate_int: createOrderV2Dto.base_rate_int,
        
        extra_distance_string: createOrderV2Dto.extra_distance_string,
        extra_distance_int: createOrderV2Dto.extra_distance_int,
        
        calculated_distance_string: createOrderV2Dto.calculated_distance_string,
        calculated_distance_int: createOrderV2Dto.calculated_distance_int,
        
        extra_distance_rate_string: createOrderV2Dto.extra_distance_rate_string,
        extra_distance_rate_int: createOrderV2Dto.extra_distance_rate_int,
        
        final_amount_string: createOrderV2Dto.final_amount_string,
        final_amount_int: createOrderV2Dto.final_amount_int,
        
        image_url: createOrderV2Dto.image_url,
        
        cgst_rate_int: createOrderV2Dto.cgst_rate_int,
        sgst_rate_int: createOrderV2Dto.sgst_rate_int,
        other_tax_rate_int: createOrderV2Dto.other_tax_rate_int,
        
        cgst_int: createOrderV2Dto.cgst_int,
        sgst_int: createOrderV2Dto.sgst_int,
        other_tax_int: createOrderV2Dto.other_tax_int,
        grand_total_int: createOrderV2Dto.grand_total_int,
        
        cgst_string: createOrderV2Dto.cgst_string,
        sgst_string: createOrderV2Dto.sgst_string,
        other_tax_string: createOrderV2Dto.other_tax_string,
        grand_total_string: createOrderV2Dto.grand_total_string,
        
        conditions: createOrderV2Dto.conditions,
      } : undefined,
    };

    const order = await this._orderService.createAsync(createOrderDto);
    return ResponseDto.created('Order created successfully', order);
  }
}
