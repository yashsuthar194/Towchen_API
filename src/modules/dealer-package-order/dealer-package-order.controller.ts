import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DealerPackageOrderService } from './dealer-package-order.service';
import { CreateDealerPackageOrderDto } from './dto/create-dealer-package-order.dto';
import { UpdatePackageUsageDto } from './dto/update-package-usage.dto';
import { DealerPackageOrderQueryDto } from './dto/dealer-package-order-query.dto';
import {
  DealerPackageOrderResponseDto,
  DealerPackageOrderListResponseDto,
} from './dto/dealer-package-order-response.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { DealerGuard } from 'src/services/jwt/guards/dealer.guard';
import { AdminGuard } from 'src/services/jwt/guards/admin.guard';
import { CallerService } from 'src/services/jwt/caller.service';

@ApiTags('Dealer Package Orders')
@Controller('dealer-package-order')
export class DealerPackageOrderController {
  constructor(
    private readonly orderService: DealerPackageOrderService,
    private readonly callerService: CallerService,
  ) {}

  // =========================================================================
  // DEALER PORTAL ENDPOINTS
  // =========================================================================

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, DealerGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Onboard customer & vehicle, assign package plan, and generate PDF certificate',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'customer_name',
        'customer_number',
        'email_address',
        'city',
        'state',
        'pincode',
        'vehicle_reg_number',
        'vehicle_make',
        'vehicle_model',
        'vehicle_fuel_type',
        'transmission_type',
        'registration_year',
        'chassis_number',
        'current_odometer_reading',
        'car_segment',
        'package_plan_id',
        'package_plan_start_date',
        'image_front',
        'image_rear',
        'image_left',
        'image_right',
        'odometer_image',
      ],
      properties: {
        customer_name: { type: 'string', example: 'Rahul Sharma' },
        customer_number: { type: 'string', example: '+919876543210' },
        alternative_number: { type: 'string', example: '+919876543211' },
        email_address: { type: 'string', example: 'rahul.sharma@example.com' },
        building: { type: 'string', example: 'Flat 402' },
        block: { type: 'string', example: 'Wing B' },
        road: { type: 'string', example: 'MG Road' },
        city: { type: 'string', example: 'Mumbai' },
        state: { type: 'string', example: 'Maharashtra' },
        pincode: { type: 'string', example: '400001' },
        gst_number: { type: 'string', example: '27AAAAA0000A1Z5' },
        vehicle_reg_number: { type: 'string', example: 'MH02AB1234' },
        vehicle_make: { type: 'string', example: 'Maruti Suzuki' },
        vehicle_model: { type: 'string', example: 'Dzire' },
        vehicle_fuel_type: {
          type: 'string',
          enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG'],
        },
        transmission_type: { type: 'string', enum: ['Manual', 'Automatic'] },
        registration_year: { type: 'integer', example: 2022 },
        chassis_number: { type: 'string', example: 'MA3EAA12S00123456' },
        current_odometer_reading: { type: 'number', example: 34500 },
        car_segment: { type: 'string', enum: ['Basic', 'Standard', 'Premium'] },
        package_plan_id: { type: 'integer', example: 1 },
        package_plan_start_date: { type: 'string', example: '2026-10-04' },
        vehicle_images_meta: {
          type: 'string',
          example:
            '{"latitude": 19.076, "longitude": 72.877, "captured_at": "2026-10-04T15:00:00.000Z"}',
        },
        odometer_image_meta: {
          type: 'string',
          example:
            '{"latitude": 19.076, "longitude": 72.877, "captured_at": "2026-10-04T15:00:00.000Z"}',
        },
        image_front: { type: 'string', format: 'binary' },
        image_rear: { type: 'string', format: 'binary' },
        image_left: { type: 'string', format: 'binary' },
        image_right: { type: 'string', format: 'binary' },
        odometer_image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponseDto(DealerPackageOrderResponseDto, false, 201)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image_front', maxCount: 1 },
      { name: 'image_rear', maxCount: 1 },
      { name: 'image_left', maxCount: 1 },
      { name: 'image_right', maxCount: 1 },
      { name: 'odometer_image', maxCount: 1 },
    ]),
  )
  async createOrder(
    @Body() dto: CreateDealerPackageOrderDto,
    @UploadedFiles()
    files: {
      image_front?: Express.Multer.File[];
      image_rear?: Express.Multer.File[];
      image_left?: Express.Multer.File[];
      image_right?: Express.Multer.File[];
      odometer_image?: Express.Multer.File[];
    },
  ) {
    const dealerId = this.callerService.getUserId();

    const inspectionFiles = {
      image_front: files?.image_front?.[0],
      image_rear: files?.image_rear?.[0],
      image_left: files?.image_left?.[0],
      image_right: files?.image_right?.[0],
      odometer_image: files?.odometer_image?.[0],
    };

    const order = await this.orderService.createOrderAsync(
      dealerId,
      dto,
      inspectionFiles,
    );

    return ResponseDto.created(
      'Dealer package order created and certificate generated successfully',
      order as any,
    );
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, DealerGuard)
  @ApiOperation({ summary: 'Get paginated list of packages created by the logged-in dealer' })
  @ApiResponseDto(DealerPackageOrderListResponseDto)
  async findAllByDealer(@Query() query: DealerPackageOrderQueryDto) {
    const dealerId = this.callerService.getUserId();
    const result = await this.orderService.findAllByDealerAsync(dealerId, query);
    return ResponseDto.retrieved(
      'Dealer package orders retrieved successfully',
      result as any,
    );
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, DealerGuard)
  @ApiOperation({ summary: 'Get package order details by ID for logged-in dealer' })
  @ApiResponseDto(DealerPackageOrderResponseDto)
  async findOneByDealer(@Param('id', ParseIntPipe) id: number) {
    const dealerId = this.callerService.getUserId();
    const order = await this.orderService.findOneAsync(id, dealerId);
    return ResponseDto.retrieved(
      'Dealer package order retrieved successfully',
      order as any,
    );
  }

  @Get(':id/download')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, DealerGuard)
  @ApiOperation({ summary: 'Get downloadable certificate PDF URL for dealer package' })
  async downloadCertificate(@Param('id', ParseIntPipe) id: number) {
    const dealerId = this.callerService.getUserId();
    const order = await this.orderService.findOneAsync(id, dealerId);

    if (!order.package_pdf_url) {
      throw new BadRequestException('Certificate PDF is not available for this order.');
    }

    return ResponseDto.retrieved('Certificate download URL retrieved successfully', {
      order_number: order.order_number,
      download_url: order.package_pdf_url,
    });
  }

  // =========================================================================
  // ADMIN PORTAL ENDPOINTS
  // =========================================================================

  @Get('admin/all')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get all package orders across all dealers (Admin only)' })
  @ApiResponseDto(DealerPackageOrderListResponseDto)
  async findAllAdmin(@Query() query: DealerPackageOrderQueryDto) {
    const result = await this.orderService.findAllAdminAsync(query);
    return ResponseDto.retrieved(
      'All dealer package orders retrieved successfully',
      result as any,
    );
  }

  @Get('admin/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get package order details by ID (Admin only)' })
  @ApiResponseDto(DealerPackageOrderResponseDto)
  async findOneAdmin(@Param('id', ParseIntPipe) id: number) {
    const order = await this.orderService.findOneAsync(id);
    return ResponseDto.retrieved(
      'Dealer package order retrieved successfully',
      order as any,
    );
  }

  @Patch('admin/:id/usage')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({
    summary:
      'Manually update package usage for hotel accommodation, cab service, incidents, or notes (Admin only)',
  })
  @ApiResponseDto(DealerPackageOrderResponseDto)
  async updateUsage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePackageUsageDto,
  ) {
    const updated = await this.orderService.updateUsageAsync(id, dto);
    return ResponseDto.updated(
      'Dealer package usage updated successfully',
      updated as any,
    );
  }
}
