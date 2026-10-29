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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { AdminPackageOrderService } from './admin-package-order.service';
import { CreateAdminPackageOrderDto } from './dto/create-admin-package-order.dto';
import { AdminPackageOrderQueryDto } from './dto/admin-package-order-query.dto';
import {
  CancelAdminPackageOrderDto,
  RescheduleAdminPackageOrderDto,
} from './dto/cancel-admin-package-order.dto';
import {
  AdminPackageOrderResponseDto,
  AdminPackageOrderListResponseDto,
} from './dto/admin-package-order-response.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { AdminGuard } from 'src/services/jwt/guards/admin.guard';
import { CallerService } from 'src/services/jwt/caller.service';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';

@ApiTags('Admin Package Order')
@Controller('admin-package-order')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminPackageOrderController {
  constructor(
    private readonly service: AdminPackageOrderService,
    private readonly callerService: CallerService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiOperation({
    summary:
      'Create an order for a dealer customer package (Admin Dashboard Form with multi-image upload)',
    description:
      'Validates active package, verifies available incidents (incidents_used < incidents_allowed), ' +
      'atomically deducts one incident, validates journey type (FourWay drop location mandatory), ' +
      'uploads multiple vehicle condition images, and creates the order.',
  })
  @ApiResponseDto(AdminPackageOrderResponseDto, false, 201)
  async create(
    @Body() dto: CreateAdminPackageOrderDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    const adminId = this.callerService.getUserId();
    const result = await this.service.createOrderAsync(dto, files, adminId);
    return ResponseDto.created('Admin package order created successfully', result as any);
  }

  @Get()
  @ApiOperation({
    summary: 'Get paginated list of admin package orders with optional filters',
  })
  @ApiResponseDto(AdminPackageOrderListResponseDto, false, 200)
  async findAll(@Query() query: AdminPackageOrderQueryDto) {
    const result = await this.service.findAllAsync(query);
    return ResponseDto.retrieved(
      'Admin package orders retrieved successfully',
      result as any,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get admin package order details by ID',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the admin package order', example: 1 })
  @ApiResponseDto(AdminPackageOrderResponseDto, false, 200)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.findOneAsync(id);
    return ResponseDto.retrieved(
      'Admin package order retrieved successfully',
      result as any,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel an admin package order and refund the consumed package incident',
    description:
      'Only orders in Scheduled or New status can be cancelled. ' +
      'Automatically increments available incidents on the customer package (refunds incidents_used).',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the admin package order', example: 1 })
  @ApiResponseDto(AdminPackageOrderResponseDto, false, 200)
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelAdminPackageOrderDto,
  ) {
    const adminId = this.callerService.getUserId();
    const result = await this.service.cancelOrderAsync(id, dto.reason, adminId);
    return ResponseDto.updated(
      'Admin package order cancelled successfully and 1 incident refunded to package',
      result as any,
    );
  }

  @Patch(':id/reschedule')
  @ApiOperation({
    summary: 'Reschedule activation time of a pending Scheduled package order',
    description:
      'Only orders in Scheduled status can be rescheduled. ' +
      'Validates that the new activation time is in the future and within package validity.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the admin package order', example: 1 })
  @ApiResponseDto(AdminPackageOrderResponseDto, false, 200)
  async reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleAdminPackageOrderDto,
  ) {
    const adminId = this.callerService.getUserId();
    const result = await this.service.rescheduleOrderAsync(id, dto, adminId);
    return ResponseDto.updated(
      'Admin package order rescheduled successfully',
      result as any,
    );
  }
}
