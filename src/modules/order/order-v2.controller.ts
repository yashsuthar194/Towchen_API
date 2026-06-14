import { Controller, Post, Body, UseGuards, Get, Param, ParseIntPipe, Delete, Query, BadRequestException, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from 'src/services/storage/storage.service';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { OrderService } from './order.service';
import { CreateOrderV2Dto } from './dto/create-order-v2.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import { ScheduledOrderDetailDto } from './dto/scheduled-order-detail.dto';
import { ScheduledOrderService } from './scheduled-order.service';
import { CallerService } from 'src/services/jwt/caller.service';

@ApiTags('Order V2')
@Controller('v2/order')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrderV2Controller {
  constructor(
    private readonly _orderService: OrderService,
    private readonly _scheduledOrderService: ScheduledOrderService,
    private readonly _callerService: CallerService,
    private readonly _storageService: StorageService,
  ) {}

  // ─── Create / Schedule ─────────────────────────────────────────────────────

  /**
   * Create an immediate order OR schedule one for a future time.
   *
   * - Without `scheduled_at` → order is created immediately (existing behaviour).
   * - With `scheduled_at`    → order is saved as a booking and promoted to a live
   *   order at the specified time by the background processor.
   */
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('pre_booked_images', 4))
  @ApiOperation({
    summary: 'Create an immediate order or schedule one for later (V2 Flat Input)',
    description:
      '**Immediate order** (existing flow): omit `scheduled_at`.\n\n' +
      '**Scheduled order** (Book for Later): include `scheduled_at` as an ISO 8601 string ' +
      '(e.g. `"2026-06-05T10:00:00+05:30"`). The order will be automatically promoted ' +
      `to a live order at that time.\n\n` +
      '**Booking window:** at least 5 minutes from now, at most 7 days ahead.',
  })
  @ApiResponseDto(OrderDetailDto, false, 201)
  async create(
    @Body() dto: CreateOrderV2Dto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ResponseDto<OrderDetailDto | ScheduledOrderDetailDto>> {
    if (!files || files.length !== 4) {
      throw new BadRequestException('Exactly 4 pre-booked images are required.');
    }

    // Upload files to storage
    const uploadedUrls = await Promise.all(
      files.map((file, index) =>
        this._storageService
          .uploadFileAsync({
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            folderPath: `order/pre_booked/${uuidv4()}/${index}`,
          })
          .then((res) => res.url),
      ),
    );

    const createOrderDto = this.mapToCreateOrderDto(dto);
    createOrderDto.pre_booked_images = uploadedUrls;

    if (dto.scheduled_at) {
      const customerId = this._callerService.getUserId();
      const parsedScheduledAt = this.parseScheduledAt(dto.scheduled_at);
      const scheduled = await this._scheduledOrderService.scheduleAsync(
        customerId,
        parsedScheduledAt,
        undefined, // default timezone (Asia/Kolkata)
        createOrderDto,
      );
      return ResponseDto.created('Order scheduled successfully', scheduled);
    }

    const order = await this._orderService.createAsync(createOrderDto);
    return ResponseDto.created('Order created successfully', order);
  }

  // ─── Scheduled-order management ────────────────────────────────────────────

  @Get('scheduled')
  @ApiOperation({
    summary: 'List all scheduled (Book for Later) orders for the current customer',
  })
  @ApiResponseDto(ScheduledOrderDetailDto, true, 200)
  async listScheduled(): Promise<ResponseDto<ScheduledOrderDetailDto[]>> {
    const customerId = this._callerService.getUserId();
    const rows = await this._scheduledOrderService.getListForCustomerAsync(customerId);
    return ResponseDto.retrieved('Scheduled orders fetched successfully', rows);
  }

  @Get('scheduled/:id')
  @ApiOperation({ summary: 'Get a single scheduled order by ID' })
  @ApiParam({ name: 'id', description: 'Scheduled order ID', example: 1 })
  @ApiResponseDto(ScheduledOrderDetailDto, false, 200)
  async getScheduled(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<ScheduledOrderDetailDto>> {
    const customerId = this._callerService.getUserId();
    const row = await this._scheduledOrderService.getByIdAsync(id, customerId);
    return ResponseDto.retrieved('Scheduled order fetched successfully', row);
  }

  @Delete('scheduled/:id')
  @ApiOperation({ summary: 'Cancel a Pending scheduled order' })
  @ApiParam({ name: 'id', description: 'Scheduled order ID to cancel', example: 1 })
  @ApiQuery({ name: 'reason', required: false, description: 'Optional cancellation reason' })
  @ApiResponseDto(ScheduledOrderDetailDto, false, 200)
  async cancelScheduled(
    @Param('id', ParseIntPipe) id: number,
    @Query('reason') reason?: string,
  ): Promise<ResponseDto<ScheduledOrderDetailDto>> {
    const customerId = this._callerService.getUserId();
    const row = await this._scheduledOrderService.cancelAsync(id, customerId, reason);
    return ResponseDto.updated('Scheduled order cancelled successfully', row);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Maps the flat V2 DTO to the canonical CreateOrderDto.
   * Centralised here so both the immediate and scheduled paths use the
   * same mapping — zero duplication.
   */
  private mapToCreateOrderDto(dto: CreateOrderV2Dto): CreateOrderDto {
    return {
      customer_vehicle_id: dto.customer_vehicle_id,
      service_id: dto.service_id,
      sub_service_id: dto.sub_service_id,
      breakdown_location: { place_id: dto.breakdown_place_id },
      drop_location: dto.dropoff_place_id ? { place_id: dto.dropoff_place_id } : undefined,
      breakdown_contact_name: dto.breakdown_contact_name,
      breakdown_contact_number: dto.breakdown_contact_number,
      drop_contact_name: dto.drop_contact_name,
      drop_contact_number: dto.drop_contact_number,
      voucher_code: dto.voucher_code,
      pre_booked_images: [],
      sub_service_estimate: dto.name
        ? {
            id: dto.sub_service_id,
            name: dto.name,
            ton: dto.ton,
            journey_type: dto.journey_type,
            base_distance_int: dto.base_distance_int,
            base_rate_string: dto.base_rate_string,
            base_rate_int: dto.base_rate_int,
            extra_distance_string: dto.extra_distance_string,
            extra_distance_int: dto.extra_distance_int,
            calculated_distance_string: dto.calculated_distance_string,
            calculated_distance_int: dto.calculated_distance_int,
            extra_distance_rate_string: dto.extra_distance_rate_string,
            extra_distance_rate_int: dto.extra_distance_rate_int,
            final_amount_string: dto.final_amount_string,
            final_amount_int: dto.final_amount_int,
            image_url: dto.image_url,
            cgst_rate_int: dto.cgst_rate_int,
            sgst_rate_int: dto.sgst_rate_int,
            other_tax_rate_int: dto.other_tax_rate_int,
            cgst_int: dto.cgst_int,
            sgst_int: dto.sgst_int,
            other_tax_int: dto.other_tax_int,
            grand_total_int: dto.grand_total_int,
            cgst_string: dto.cgst_string,
            sgst_string: dto.sgst_string,
            other_tax_string: dto.other_tax_string,
            grand_total_string: dto.grand_total_string,
            conditions: dto.conditions,
          }
        : undefined,
    };
  }

  private parseScheduledAt(scheduledAt: string): string {
    const trimmed = scheduledAt.trim();

    // Format: "06 Jun, 11:48 AM" or "6 Jun 11:48 AM"
    const regex = /^(\d{1,2})\s+([A-Za-z]{3}),?\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)$/i;
    const match = trimmed.match(regex);

    if (match) {
      const day = parseInt(match[1], 10);
      const monthName = match[2].toLowerCase();
      const MONTH_MAP: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      const month = MONTH_MAP[monthName];
      if (month === undefined) {
        throw new BadRequestException(`Invalid month name: "${match[2]}"`);
      }

      // Resolve year: default to current year. If target month is earlier than current month, assume next year.
      const kolkataTimeStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const nowInKolkata = new Date(kolkataTimeStr);
      const currentYear = nowInKolkata.getFullYear();
      const currentMonth = nowInKolkata.getMonth();

      let year = currentYear;
      if (month < currentMonth) {
        year = currentYear + 1;
      }

      let hour = parseInt(match[3], 10);
      const minute = parseInt(match[4], 10);
      const ampm = match[5].toLowerCase();

      if (ampm === 'pm' && hour < 12) {
        hour += 12;
      } else if (ampm === 'am' && hour === 12) {
        hour = 0;
      }

      // India Standard Time (IST, UTC+05:30)
      const pad = (num: number) => String(num).padStart(2, '0');
      const isoString = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`;
      const date = new Date(isoString);

      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid scheduled_at date calculations.');
      }
      return date.toISOString();
    }

    // Fallback: see if standard Date constructor can parse it (e.g. ISO 8601)
    const fallbackDate = new Date(trimmed);
    if (isNaN(fallbackDate.getTime())) {
      throw new BadRequestException('Invalid scheduled_at date format. Expected format: "06 Jun, 11:48 AM" or ISO 8601.');
    }
    return fallbackDate.toISOString();
  }
}
