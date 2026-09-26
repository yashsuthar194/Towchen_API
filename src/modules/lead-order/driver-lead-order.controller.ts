import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Body,
  Get,
  Req,
  Put,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { DriverGuard } from 'src/services/jwt/guards/driver.guard';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { OrderStatus, LeadStatus, OrderOtpType } from '@prisma/client';

import { LeadOrderService } from './lead-order.service';
import { LeadEvcrfService } from './lead-evcrf.service';
import { SendLeadOtpDto } from './dto/send-lead-order-otp.dto';
import { VerifyLeadOtpDto } from './dto/verify-lead-order-otp.dto';
import { CancelLeadDto } from './dto/cancel-lead.dto';
import { SubmitPickupLeadEvcrfDto } from './dto/submit-pickup-lead-evcrf.dto';
import { SubmitDropoffLeadEvcrfDto } from './dto/submit-dropoff-lead-evcrf.dto';
import { FilesInterceptor, FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileHelper } from 'src/shared/helper/file-helper';
import { UploadOrderImagesDto } from '../order/dto/upload-order-images.dto';
import { UploadPhysicalVcrfDto } from '../order/dto/upload-physical-vcrf.dto';
import { AddDamageDto } from '../evcrf/dto/add-damage.dto';
import { VehicleClassMappingService } from '../vehicle-class-mapping/vehicle-class-mapping.service';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { LeadOrderDetailDto } from './dto/lead-order-detail.dto';
import { PhysicalVcrfResponseDto, EvcrfSubmissionResponseDto, VerifyOtpResponseDto } from '../order/dto/job-card-response.dto';
import { EvcrfConfigResponseDto } from '../evcrf/dto/evcrf-config-response.dto';
import { EvcrfPrefillResponseDto, DropoffEvcrfPrefillResponseDto } from '../evcrf/dto/evcrf-prefill-response.dto';

@ApiTags('Driver Lead')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, DriverGuard)
@Controller('driver/lead')
export class DriverLeadOrderController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadOrderService: LeadOrderService,
    private readonly leadEvcrfService: LeadEvcrfService,
    private readonly vehicleClassMappingService: VehicleClassMappingService,
  ) {}

  @Get(['', 'pending'])
  @ApiOperation({ summary: 'List leads currently available or assigned to this driver' })
  async getLeads(@Req() req) {
    const driverId = req.user.id;
    const leads = await this.leadOrderService.getLeadOrdersForDriver(driverId);
    return ResponseDto.retrieved('Leads fetched successfully', leads);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead details by ID (Driver only)' })
  @ApiParam({ name: 'id', description: 'Numeric ID of the lead', example: 1 })
  @ApiResponseDto(LeadOrderDetailDto, false, 200)
  async getById(@Param('id', ParseIntPipe) id: number) {
    const lead = await this.leadOrderService.getLeadOrderById(id);
    return ResponseDto.retrieved('Lead details fetched successfully', lead);
  }

  @Put(':id/accept')
  @ApiOperation({ summary: 'Accept a lead (Driver only)' })
  @ApiParam({ name: 'id', description: 'ID of the lead to accept', example: 1 })
  async acceptLead(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    if (lead.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this lead');
    }
    if (
      lead.order_status === OrderStatus.Completed ||
      lead.order_status === OrderStatus.Closed
    ) {
      throw new BadRequestException(
        `Cannot accept a lead in ${lead.order_status.toLowerCase()} status`,
      );
    }
    // Auto-generate START OTP and advance order status to OtpPending (order flow style)
    await this.leadOrderService.sendOrderOtpAsync(id, OrderOtpType.BREAKDOWN, driverId);
    const updated = await this.leadOrderService.getLeadOrderById(id);
    return ResponseDto.updated('Lead accepted successfully', updated);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a lead (Driver only)' })
  @ApiParam({ name: 'id', description: 'ID of the lead to cancel', example: 1 })
  async cancelLead(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelLeadDto,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }
    if (lead.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this lead');
    }
    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        order_status: OrderStatus.Closed,
        status: LeadStatus.Cancelled,
        cancel_reason: dto?.reason ?? null,
        completion_time: new Date(),
      },
    });

    return ResponseDto.updated('Lead cancelled successfully', updatedLead);
  }

  @Post(':id/send-otp')
  @ApiOperation({
    summary: 'Request an OTP for lead start or completion (Driver only)',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the lead', example: 1 })
  async sendOtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendLeadOtpDto,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.sendOrderOtpAsync(id, dto.type, driverId);
    return ResponseDto.success(result.message, result);
  }

  @Post(':id/verify-otp')
  @ApiOperation({
    summary: 'Verify a lead OTP and update status (Driver only)',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the lead', example: 1 })
  @ApiResponseDto(VerifyOtpResponseDto, false, 200)
  async verifyOtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyLeadOtpDto,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.verifyOrderOtpAsync(id, dto.type, dto.otp, driverId);
    return ResponseDto.success(result.message, result);
  }

  @Put(':id/pre-pickup-images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadOrderImagesDto })
  @ApiOperation({ summary: 'Upload pre-pickup images for a lead (Driver only)' })
  @UseInterceptors(FilesInterceptor('files', 10, { fileFilter: FileHelper.imageFilter }))
  async uploadPrePickupImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.uploadLeadOrderImagesAsync(id, driverId, 'pre_pickup', files);
    return ResponseDto.updated('Pre-pickup images uploaded successfully', result);
  }

  @Put(':id/post-pickup-images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadOrderImagesDto })
  @ApiOperation({ summary: 'Upload post-pickup images for a lead (Driver only)' })
  @UseInterceptors(FilesInterceptor('files', 10, { fileFilter: FileHelper.imageFilter }))
  async uploadPostPickupImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.uploadLeadOrderImagesAsync(id, driverId, 'post_pickup', files);
    return ResponseDto.updated('Post-pickup images uploaded successfully', result);
  }

  @Put(':id/dropoff-images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadOrderImagesDto })
  @ApiOperation({ summary: 'Upload dropoff images for a lead (Driver only)' })
  @UseInterceptors(FilesInterceptor('files', 10, { fileFilter: FileHelper.imageFilter }))
  async uploadDropoffImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.uploadLeadOrderImagesAsync(id, driverId, 'dropoff', files);
    return ResponseDto.updated('Dropoff images uploaded successfully', result);
  }

  @Put(':id/physical-pickup-vcrf')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPhysicalVcrfDto })
  @ApiOperation({ summary: 'Upload physical pickup VCRF image for a lead (Driver only)' })
  @ApiResponseDto(PhysicalVcrfResponseDto, false, 200)
  @UseInterceptors(FileInterceptor('file', { fileFilter: FileHelper.imageFilter }))
  async uploadPhysicalPickupVcrf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.uploadPhysicalVcrfImageAsync(id, driverId, 'pickup', file);
    return ResponseDto.updated('Physical pickup VCRF image uploaded successfully', { ...result, filled_in: 'vcrf', job_card_type: 'VCRF' });
  }

  @Put(':id/physical-dropoff-vcrf')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPhysicalVcrfDto })
  @ApiOperation({ summary: 'Upload physical dropoff VCRF image for a lead (Driver only)' })
  @ApiResponseDto(PhysicalVcrfResponseDto, false, 200)
  @UseInterceptors(FileInterceptor('file', { fileFilter: FileHelper.imageFilter }))
  async uploadPhysicalDropoffVcrf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.uploadPhysicalVcrfImageAsync(id, driverId, 'dropoff', file);
    return ResponseDto.updated('Physical dropoff VCRF image uploaded successfully', { ...result, filled_in: 'vcrf', job_card_type: 'VCRF' });
  }

  @Post(':id/evcrf/pickup')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit EVCRF for lead pickup (Driver only)',
  })
  @ApiResponseDto(EvcrfSubmissionResponseDto, false, 201)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'odometer_image', maxCount: 1 },
      { name: 'driver_image', maxCount: 1 },
      { name: 'driver_sign', maxCount: 1 },
    ], { fileFilter: FileHelper.imageFilter }),
  )
  async submitPickupEvcrf(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitPickupLeadEvcrfDto,
    @UploadedFiles() files: { 
      odometer_image?: Express.Multer.File[]; 
      driver_image?: Express.Multer.File[]; 
      driver_sign?: Express.Multer.File[]; 
    },
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadEvcrfService.submitPickupEvcrfAsync(id, driverId, dto, files);
    return ResponseDto.created('Pickup EVCRF submitted successfully', { ...result, filled_in: 'evcrf', job_card_type: 'EVCRF' });
  }

  @Get(':id/evcrf/pickup')
  @ApiOperation({ summary: 'Get EVCRF for lead pickup' })
  async getPickupEvcrf(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getPickupEvcrfAsync(id);
    return ResponseDto.retrieved('Pickup EVCRF retrieved', result);
  }

  @Post(':id/evcrf/dropoff')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit EVCRF for lead dropoff' })
  @ApiResponseDto(EvcrfSubmissionResponseDto, false, 201)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'handover_image', maxCount: 1 },
      { name: 'handover_signature', maxCount: 1 },
    ], { fileFilter: FileHelper.imageFilter }),
  )
  async submitDropoffEvcrf(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitDropoffLeadEvcrfDto,
    @UploadedFiles() files: { 
      handover_image?: Express.Multer.File[]; 
      handover_signature?: Express.Multer.File[]; 
    },
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadEvcrfService.submitDropoffEvcrfAsync(id, driverId, dto, files);
    return ResponseDto.created('Dropoff EVCRF submitted successfully', { ...result, filled_in: 'evcrf', job_card_type: 'EVCRF' });
  }

  @Get(':id/evcrf/dropoff')
  @ApiOperation({ summary: 'Get EVCRF for lead dropoff' })
  async getDropoffEvcrf(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getDropoffEvcrfAsync(id);
    return ResponseDto.retrieved('Dropoff EVCRF retrieved', result);
  }

  @Get(':id/evcrf/config')
  @ApiOperation({ summary: 'Get EVCRF configuration for lead (Driver only)' })
  @ApiResponseDto(EvcrfConfigResponseDto, false, 200)
  async getEvcrfConfiguration(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getEvcrfConfigurationAsync(id);
    return ResponseDto.retrieved('EVCRF configuration retrieved successfully', result);
  }

  @Get(':id/evcrf/prefill-data')
  @ApiOperation({ summary: 'Get EVCRF pre-fill data for lead (Driver only)' })
  @ApiResponseDto(EvcrfPrefillResponseDto, false, 200)
  async getEvcrfPrefillData(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getEvcrfPrefillDataAsync(id);
    return ResponseDto.retrieved('EVCRF prefill data retrieved successfully', result);
  }

  @Get(':id/evcrf/dropoff/prefill-data')
  @ApiOperation({ summary: 'Get EVCRF dropoff pre-fill data for lead (Driver only)' })
  @ApiResponseDto(DropoffEvcrfPrefillResponseDto, false, 200)
  async getDropoffEvcrfPrefillData(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getDropoffEvcrfPrefillDataAsync(id);
    return ResponseDto.retrieved('Dropoff EVCRF prefill data retrieved successfully', result);
  }

  @Get('vehicle-class-config/:subClass')
  @ApiOperation({
    summary: 'Get EVCRF configuration by sub-class (Driver only)',
    description: 'Retrieves the diagram details and total damage points based on the provided sub-class string (e.g. LMV, SUV).',
  })
  async getVehicleClassConfigBySubClass(@Param('subClass') subClass: string) {
    const result = await this.vehicleClassMappingService.getConfigBySubClassAsync(subClass);
    return ResponseDto.retrieved('Vehicle class configuration retrieved successfully', result);
  }

  @Post('evcrf/:jobCardId/damage')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add damage to lead pickup EVCRF (Driver only)' })
  @UseInterceptors(FileInterceptor('damage_image', { fileFilter: FileHelper.imageFilter }))
  async addDamage(
    @Param('jobCardId', ParseIntPipe) jobCardId: number,
    @Body() dto: AddDamageDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.leadEvcrfService.addDamageAsync(jobCardId, dto, file);
    return ResponseDto.created('Damage added successfully', result);
  }
}