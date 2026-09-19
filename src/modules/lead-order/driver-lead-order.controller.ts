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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { DriverGuard } from 'src/services/jwt/guards/driver.guard';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { OrderStatus, LeadStatus } from '@prisma/client';

import { LeadOrderService } from './lead-order.service';
import { LeadEvcrfService } from './lead-evcrf.service';
import { SendLeadOrderOtpDto } from './dto/send-lead-order-otp.dto';
import { VerifyLeadOrderOtpDto } from './dto/verify-lead-order-otp.dto';
import { SubmitPickupLeadEvcrfDto } from './dto/submit-pickup-lead-evcrf.dto';
import { SubmitDropoffLeadEvcrfDto } from './dto/submit-dropoff-lead-evcrf.dto';
import { FilesInterceptor, FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileHelper } from 'src/shared/helper/file-helper';
import { UploadOrderImagesDto } from '../order/dto/upload-order-images.dto';
import { UploadPhysicalVcrfDto } from '../order/dto/upload-physical-vcrf.dto';
import { AddDamageDto } from '../evcrf/dto/add-damage.dto';

@ApiTags('Driver Lead Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, DriverGuard)
@Controller('driver/lead-orders')
export class DriverLeadOrderController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadOrderService: LeadOrderService,
    private readonly leadEvcrfService: LeadEvcrfService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all assigned lead orders for the driver' })
  async getLeadOrders(@Req() req) {
    const driverId = req.user.id;
    const leadOrders = await this.leadOrderService.getLeadOrdersForDriver(driverId);
    return new ResponseDto(true, 200, 'Lead orders fetched successfully', leadOrders);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead order details by ID (Driver only)' })
  @ApiParam({ name: 'id', description: 'Numeric ID of the lead order', example: 1 })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const leadOrder = await this.leadOrderService.getLeadOrderById(id);
    return new ResponseDto(true, 200, 'Lead order details fetched successfully', leadOrder);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept a lead order' })
  async acceptLeadOrder(@Param('id', ParseIntPipe) id: number) {
    const leadOrder = await this.prisma.lead.update({
      where: { id },
      data: {
        order_status: OrderStatus.Assigned,
        assign_time: new Date(),
      },
    });
    return new ResponseDto(true, 200, 'Lead order accepted', leadOrder);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a lead order' })
  async cancelLeadOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    const leadOrder = await this.prisma.lead.update({
      where: { id },
      data: {
        order_status: OrderStatus.Closed,
        status: LeadStatus.Cancelled,
        cancel_reason: reason,
        completion_time: new Date(),
      },
    });

    return new ResponseDto(true, 200, 'Lead order cancelled', leadOrder);
  }

  @Post(':id/send-otp')
  @ApiOperation({
    summary: 'Request an OTP for lead order start or completion (Driver only)',
  })
  async sendOtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendLeadOrderOtpDto,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.sendOrderOtpAsync(id, dto.type, driverId);
    return new ResponseDto(true, 200, result.message, null);
  }

  @Post(':id/verify-otp')
  @ApiOperation({
    summary: 'Verify a lead order OTP and update status (Driver only)',
  })
  async verifyOtp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyLeadOrderOtpDto,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.verifyOrderOtpAsync(id, dto.type, dto.otp, driverId);
    return new ResponseDto(true, 200, result.message, null);
  }

  @Put(':id/pre-pickup-images')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadOrderImagesDto })
  @ApiOperation({ summary: 'Upload pre-pickup images for a lead order (Driver only)' })
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
  @ApiOperation({ summary: 'Upload post-pickup images for a lead order (Driver only)' })
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
  @ApiOperation({ summary: 'Upload dropoff images for a lead order (Driver only)' })
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
  @ApiOperation({ summary: 'Upload physical pickup VCRF image for a lead order (Driver only)' })
  @UseInterceptors(FileInterceptor('file', { fileFilter: FileHelper.imageFilter }))
  async uploadPhysicalPickupVcrf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.uploadPhysicalVcrfImageAsync(id, driverId, 'pickup', file);
    return ResponseDto.updated('Physical pickup VCRF image uploaded successfully', { ...result, filled_in: 'vcrf' });
  }

  @Put(':id/physical-dropoff-vcrf')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadPhysicalVcrfDto })
  @ApiOperation({ summary: 'Upload physical dropoff VCRF image for a lead order (Driver only)' })
  @UseInterceptors(FileInterceptor('file', { fileFilter: FileHelper.imageFilter }))
  async uploadPhysicalDropoffVcrf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    const driverId = req.user.id;
    const result = await this.leadOrderService.uploadPhysicalVcrfImageAsync(id, driverId, 'dropoff', file);
    return ResponseDto.updated('Physical dropoff VCRF image uploaded successfully', { ...result, filled_in: 'vcrf' });
  }

  @Post(':id/evcrf/pickup')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Submit EVCRF for lead order pickup (Driver only)',
  })
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
    return new ResponseDto(true, 201, 'Pickup EVCRF submitted successfully', { ...result, filled_in: 'evcrf' });
  }

  @Get(':id/evcrf/pickup')
  @ApiOperation({ summary: 'Get EVCRF for lead order pickup' })
  async getPickupEvcrf(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getPickupEvcrfAsync(id);
    return new ResponseDto(true, 200, 'Pickup EVCRF retrieved', result);
  }

  @Post(':id/evcrf/dropoff')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Submit EVCRF for lead order dropoff' })
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
    return new ResponseDto(true, 201, 'Dropoff EVCRF submitted successfully', { ...result, filled_in: 'evcrf' });
  }

  @Get(':id/evcrf/dropoff')
  @ApiOperation({ summary: 'Get EVCRF for lead order dropoff' })
  async getDropoffEvcrf(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getDropoffEvcrfAsync(id);
    return new ResponseDto(true, 200, 'Dropoff EVCRF retrieved', result);
  }

  @Get(':id/evcrf/config')
  @ApiOperation({ summary: 'Get EVCRF configuration for lead order (Driver only)' })
  async getEvcrfConfiguration(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getEvcrfConfigurationAsync(id);
    return ResponseDto.retrieved('EVCRF configuration retrieved successfully', result);
  }

  @Get(':id/evcrf/prefill-data')
  @ApiOperation({ summary: 'Get EVCRF pre-fill data for lead order (Driver only)' })
  async getEvcrfPrefillData(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getEvcrfPrefillDataAsync(id);
    return ResponseDto.retrieved('EVCRF prefill data retrieved successfully', result);
  }

  @Get(':id/evcrf/dropoff/prefill-data')
  @ApiOperation({ summary: 'Get EVCRF dropoff pre-fill data for lead order (Driver only)' })
  async getDropoffEvcrfPrefillData(@Param('id', ParseIntPipe) id: number) {
    const result = await this.leadEvcrfService.getDropoffEvcrfPrefillDataAsync(id);
    return ResponseDto.retrieved('Dropoff EVCRF prefill data retrieved successfully', result);
  }

  @Post('evcrf/:jobCardId/damage')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add damage to lead order pickup EVCRF (Driver only)' })
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