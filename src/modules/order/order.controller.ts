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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';

@ApiTags('Order')
@Controller('order')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrderController {
  constructor(private readonly _orderService: OrderService) {}

  /**
   * Create a new order with locations
   * @param createOrderDto 
   */
  @Post()
  @ApiOperation({ summary: 'Create a new order with breakdown and drop locations' })
  async create(@Body() createOrderDto: CreateOrderDto): Promise<OrderDetailDto> {
    return await this._orderService.createAsync(createOrderDto);
  }

  /**
   * Get list of all orders
   */
  @Get()
  @ApiOperation({ summary: 'Get list of all orders' })
  async findAll(): Promise<OrderListDto[]> {
    return await this._orderService.getListAsync();
  }

  /**
   * Get details of a specific order
   * @param id Order ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific order' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<OrderDetailDto> {
    return await this._orderService.getByIdAsync(id);
  }


  /**
   * Accept an order (Driver only)
   * @param id Order ID
   */
  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept an order as a driver' })
  async accept(@Param('id', ParseIntPipe) id: number): Promise<OrderDetailDto> {
    return await this._orderService.acceptOrderAsync(id);
  }

  /**
   * Request an OTP for starting or completing an order
   * @param id Order ID
   * @param dto Send OTP type
   */
  @Post(':id/send-otp')
  @ApiOperation({ summary: 'Request an OTP for starting or completing an order' })
  async sendOtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendOrderOtpDto,
  ): Promise<{ message: string }> {
    return await this._orderService.sendOrderOtpAsync(id, dto.type);
  }

  /**
   * Verify an order OTP and update status
   * @param id Order ID
   * @param dto Verify OTP details
   */
  @Post(':id/verify-otp')
  @ApiOperation({ summary: 'Verify an order OTP and update status' })
  async verifyOtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyOrderOtpDto,
  ): Promise<{ message: string }> {
    return await this._orderService.verifyOrderOtpAsync(id, dto.type, dto.otp);
  }
}

