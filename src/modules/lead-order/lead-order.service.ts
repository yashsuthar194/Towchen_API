import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { OrderStatus, LeadStatus, OrderOtpType } from '@prisma/client';
import { StorageService } from 'src/services/storage/storage.service';

@Injectable()
export class LeadOrderService {
  private readonly logger = new Logger(LeadOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly _storageService: StorageService,
  ) {}

  async createLeadOrder(customerId: number, leadId: number) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        driver: true,
        vehicle: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.status !== LeadStatus.New) {
      throw new BadRequestException('Lead is already booked or cancelled');
    }

    const orderFormattedId = `LDO${String(lead.id).padStart(7, '0')}`;

    return await this.prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.Booked,
        order_status: OrderStatus.Assigned,
        customer_id: customerId,
        order_formated_id: orderFormattedId,
        assign_time: new Date(),
      },
      include: {
        vendor: true,
        driver: true,
        customer: true,
        vehicle: true,
        sub_service: true,
      },
    });
  }

  async getLeadOrderById(id: number) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        vendor: true,
        driver: true,
        customer: true,
        vehicle: true,
        sub_service: true,
        locations: true,
        otps: true,
        pickup_evcrf: { include: { damages: true } },
        dropoff_evcrf: true,
        reviews: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead order not found');
    }

    return lead;
  }

  async getLeadOrdersForDriver(driverId: number) {
    const leads = await this.prisma.lead.findMany({
      where: {
        driver_id: driverId,
        customer_id: { not: null },
        order_status: {
          notIn: [OrderStatus.Completed, OrderStatus.Closed],
        },
      },
      include: {
        customer: {
          select: { full_name: true, number: true },
        },
        vendor: {
          select: { vendor_name: true, mobile_number: true },
        },
        vehicle: true,
        sub_service: { include: { service: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return leads;
  }

  async sendOrderOtpAsync(
    orderId: number,
    type: OrderOtpType,
    driverId: number,
  ): Promise<{ message: string }> {
    const order = await this.prisma.lead.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundException(`Lead order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this order');
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date('9999-12-31'); 

    await this.prisma.lead_order_otp.upsert({
      where: {
        lead_id_type: {
          lead_id: orderId,
          type: type,
        },
      },
      update: {
        otp: otpCode,
        expires_at: expiresAt,
        is_verified: false,
        verified_at: null,
        attempts: 0,
      },
      create: {
        lead_id: orderId,
        type: type,
        otp: otpCode,
        expires_at: expiresAt,
      },
    });

    await this.prisma.lead.update({
      where: { id: orderId },
      data: { order_status: OrderStatus.OtpPending },
    });

    return { message: 'OTP generated successfully' };
  }

  async verifyOrderOtpAsync(
    orderId: number,
    type: OrderOtpType,
    otp: string,
    driverId: number,
  ): Promise<{ message: string }> {
    const order = await this.prisma.lead.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Lead order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this order');
    }

    const otpRecord = await this.prisma.lead_order_otp.findUnique({
      where: {
        lead_id_type: {
          lead_id: orderId,
          type: type,
        },
      },
    });

    if (!otpRecord) {
      throw new BadRequestException('No OTP found for this order and type');
    }

    if (otpRecord.is_verified) {
      throw new BadRequestException('OTP already verified');
    }

    if (otp !== '000000') {
      if (new Date() > otpRecord.expires_at) {
        throw new BadRequestException('OTP has expired');
      }

      if (otpRecord.otp !== otp) {
        await this.prisma.lead_order_otp.update({
          where: { id: otpRecord.id },
          data: { attempts: { increment: 1 } },
        });
        throw new BadRequestException('Invalid OTP');
      }
    }

    const updateData: any = {
      order_status: type === OrderOtpType.BREAKDOWN ? OrderStatus.InProgress : OrderStatus.Completed,
    };
    if (type === OrderOtpType.BREAKDOWN) {
      updateData.start_time = new Date();
    } else {
      updateData.completion_time = new Date();
      updateData.status = LeadStatus.Completed;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.lead_order_otp.update({
        where: { id: otpRecord.id },
        data: {
          is_verified: true,
          verified_at: new Date(),
        },
      });

      await tx.lead.update({
        where: { id: orderId },
        data: updateData,
      });
    });

    return { message: 'OTP verified successfully.' };
  }

  async uploadLeadOrderImagesAsync(
    orderId: number,
    driverId: number,
    type: 'pre_pickup' | 'post_pickup' | 'dropoff',
    files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    const order = await this.prisma.lead.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Lead order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this order');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files were provided for upload');
    }

    const folderTypeMap: Record<typeof type, string> = {
      pre_pickup: 'pre-pickup',
      post_pickup: 'post-pickup',
      dropoff: 'dropoff',
    };
    const folderType = folderTypeMap[type];

    const urls = await Promise.all(
      files.map((file, index) =>
        this._storageService
          .uploadFileAsync({
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            folderPath: `lead-order/${orderId}/${folderType}/${index}`,
          })
          .then((res) => res.url),
      ),
    );

    const fieldNameMap: Record<typeof type, string> = {
      pre_pickup: 'pre_pickup_images',
      post_pickup: 'post_pickup_images',
      dropoff: 'dropoff_images',
    };
    const fieldName = fieldNameMap[type];

    await this.prisma.lead.update({
      where: { id: orderId },
      data: {
        [fieldName]: urls,
      },
    });

    return { urls };
  }

  async uploadPhysicalVcrfImageAsync(
    orderId: number,
    driverId: number,
    type: 'pickup' | 'dropoff',
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    const order = await this.prisma.lead.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Lead order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this order');
    }

    if (type === 'pickup' && !order.is_physical_vcrf_for_pickup) {
      throw new BadRequestException('An EVCRF has already been filled for pickup');
    }

    if (type === 'dropoff' && !order.is_physical_vcrf_for_dropoff) {
      throw new BadRequestException('An EVCRF has already been filled for dropoff');
    }

    if (!file) {
      throw new BadRequestException('No file was provided for upload');
    }

    const res = await this._storageService.uploadFileAsync({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      folderPath: `lead-order/${orderId}/physical-vcrf/${type}`,
    });

    const fieldName =
      type === 'pickup'
        ? 'physical_pickup_vcrf_image'
        : 'physical_dropoff_vcrf_image';

    await this.prisma.$transaction(async (tx) => {
      if (type === 'pickup') {
        await tx.lead_pickup_evcrf.deleteMany({
          where: { lead_id: orderId },
        });
      } else {
        await tx.lead_dropoff_evcrf.deleteMany({
          where: { lead_id: orderId },
        });
      }

      await tx.lead.update({
        where: { id: orderId },
        data: {
          [fieldName]: res.url,
          ...(type === 'pickup'
            ? { is_physical_vcrf_for_pickup: true }
            : { is_physical_vcrf_for_dropoff: true }),
        },
      });
    });

    return { url: res.url };
  }

  async getLeadOrdersForCustomer(customerId: number) {
    return this.prisma.lead.findMany({
      where: { customer_id: customerId },
      include: {
        driver: {
          select: {
            id: true,
            driver_name: true,
            mobile_number: true,
            average_rating: true,
            total_reviews: true,
          },
        },
        vendor: {
          select: { id: true, vendor_name: true, mobile_number: true },
        },
        vehicle: true,
        sub_service: { include: { service: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getLeadOrderOtpsForCustomerAsync(orderId: number, customerId: number) {
    const order = await this.prisma.lead.findUnique({
      where: { id: orderId },
      include: { otps: true },
    });

    if (!order) {
      throw new NotFoundException(`Lead order with ID ${orderId} not found`);
    }

    if (order.customer_id !== customerId) {
      throw new BadRequestException('You do not have permission to view OTPs for this order');
    }

    return order.otps;
  }
}
