import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { StorageService } from 'src/services/storage/storage.service';
import { PackagePdfService } from './services/package-pdf.service';
import { CreateDealerPackageOrderDto } from './dto/create-dealer-package-order.dto';
import { UpdatePackageUsageDto } from './dto/update-package-usage.dto';
import { DealerPackageOrderQueryDto } from './dto/dealer-package-order-query.dto';
import { CarSegment, Prisma } from '@prisma/client';

export interface InspectionFiles {
  image_front: Express.Multer.File;
  image_rear: Express.Multer.File;
  image_left: Express.Multer.File;
  image_right: Express.Multer.File;
  odometer_image: Express.Multer.File;
}

@Injectable()
export class DealerPackageOrderService {
  private readonly logger = new Logger(DealerPackageOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly pdfService: PackagePdfService,
  ) {}

  /**
   * Creates a new dealer package order with customer, vehicle, inspection uploads, and PDF certificate
   */
  async createOrderAsync(
    dealerId: number,
    dto: CreateDealerPackageOrderDto,
    files: Partial<InspectionFiles>,
  ) {
    // 1. Verify inspection images are all provided
    const requiredFiles: (keyof InspectionFiles)[] = [
      'image_front',
      'image_rear',
      'image_left',
      'image_right',
      'odometer_image',
    ];

    for (const field of requiredFiles) {
      if (!files[field]) {
        throw new BadRequestException(`Inspection file '${field}' is required.`);
      }
    }

    // 2. Fetch authenticated dealer
    const dealer = await this.prisma.dealer.findFirst({
      where: { id: dealerId, is_deleted: false },
    });
    if (!dealer) {
      throw new NotFoundException('Dealer account not found.');
    }

    // 3. Fetch package plan
    const plan = await this.prisma.dealer_package_plan.findUnique({
      where: { id: Number(dto.package_plan_id) },
    });
    if (!plan || !plan.is_active) {
      throw new NotFoundException('Selected dealer package plan is invalid or inactive.');
    }

    // 4. Resolve price based on car segment
    let amount = plan.price_basic;
    if (dto.car_segment === CarSegment.Standard) {
      amount = plan.price_standard;
    } else if (dto.car_segment === CarSegment.Premium) {
      amount = plan.price_premium;
    }

    // 5. Calculate date boundaries
    const startDate = new Date(dto.package_plan_start_date);
    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid package plan start date format.');
    }
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + plan.plan_period_months);

    // 6. Upload 5 inspection images to Cloudflare R2 / S3
    const uploadInspectionFile = async (file: Express.Multer.File, tag: string) => {
      const result = await this.storageService.uploadFileAsync({
        buffer: file.buffer,
        originalName: `${tag}_${Date.now()}_${file.originalname}`,
        mimeType: file.mimetype,
        size: file.size,
        folderPath: 'dealer/inspections',
      });
      return result.url;
    };

    const [frontUrl, rearUrl, leftUrl, rightUrl, odoUrl] = await Promise.all([
      uploadInspectionFile(files.image_front!, 'front'),
      uploadInspectionFile(files.image_rear!, 'rear'),
      uploadInspectionFile(files.image_left!, 'left'),
      uploadInspectionFile(files.image_right!, 'right'),
      uploadInspectionFile(files.odometer_image!, 'odo'),
    ]);

    // Parse geo-metadata if sent as string
    let vehicleMeta: any = null;
    let odoMeta: any = null;
    try {
      if (dto.vehicle_images_meta) {
        vehicleMeta = typeof dto.vehicle_images_meta === 'string'
          ? JSON.parse(dto.vehicle_images_meta)
          : dto.vehicle_images_meta;
      }
      if (dto.odometer_image_meta) {
        odoMeta = typeof dto.odometer_image_meta === 'string'
          ? JSON.parse(dto.odometer_image_meta)
          : dto.odometer_image_meta;
      }
    } catch {
      this.logger.warn('Failed to parse inspection geo metadata');
    }

    // 7. Transaction to persist customer, vehicle, and order
    const result = await this.prisma.$transaction(async (tx) => {
      // Create Customer
      const customer = await tx.dealer_customer.create({
        data: {
          dealer_id: dealer.id,
          customer_name: dto.customer_name,
          customer_number: dto.customer_number,
          alternative_number: dto.alternative_number ?? null,
          email_address: dto.email_address,
          building: dto.building ?? null,
          block: dto.block ?? null,
          road: dto.road ?? null,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          gst_number: dto.gst_number ?? null,
        },
      });

      // Create Vehicle
      const vehicle = await tx.dealer_customer_vehicle.create({
        data: {
          dealer_customer_id: customer.id,
          vehicle_reg_number: dto.vehicle_reg_number.toUpperCase().trim(),
          vehicle_make: dto.vehicle_make,
          vehicle_model: dto.vehicle_model,
          vehicle_fuel_type: dto.vehicle_fuel_type,
          transmission_type: dto.transmission_type,
          registration_year: Number(dto.registration_year),
          chassis_number: dto.chassis_number.toUpperCase().trim(),
          current_odometer_reading: Number(dto.current_odometer_reading),
          car_segment: dto.car_segment,
          image_front: frontUrl,
          image_rear: rearUrl,
          image_left: leftUrl,
          image_right: rightUrl,
          vehicle_images_meta: vehicleMeta,
          odometer_image: odoUrl,
          odometer_image_meta: odoMeta,
        },
      });

      // Generate order number (DPKG + sequential padded string)
      const count = await tx.dealer_package_order.count();
      let orderNumber = `DPKG${String(count + 1).padStart(7, '0')}`;
      const existingOrder = await tx.dealer_package_order.findUnique({
        where: { order_number: orderNumber },
      });
      if (existingOrder) {
        const randomPart = Math.floor(1000 + Math.random() * 9000);
        orderNumber = `DPKG${String(count + 1).padStart(4, '0')}${randomPart}`;
      }

      // Create Order
      const order = await tx.dealer_package_order.create({
        data: {
          order_number: orderNumber,
          dealer_id: dealer.id,
          dealer_customer_id: customer.id,
          vehicle_id: vehicle.id,
          package_plan_id: plan.id,
          plan_name: plan.name,
          car_segment: dto.car_segment,
          amount,
          plan_period_months: plan.plan_period_months,
          incidents_allowed: plan.incidents,
          incidents_used: 0,
          distance_km_allowed: plan.distance_km,
          hotel_accommodation_allowed: plan.hotel_accommodation,
          hotel_accommodation_used: 0,
          cab_service_allowed: plan.cab_service,
          cab_service_used: 0,
          start_date: startDate,
          expiry_date: expiryDate,
          status: 'Active',
          payment_status: 'PendingInternalSettlement',
        },
        include: {
          customer: true,
          vehicle: true,
        },
      });

      return { order, customer, vehicle };
    });

    // 8. Generate Package Certificate PDF
    try {
      const fullAddress = [
        result.customer.building,
        result.customer.block,
        result.customer.road,
        result.customer.city,
        result.customer.state,
        result.customer.pincode,
      ]
        .filter(Boolean)
        .join(', ');

      const pdfBuffer = await this.pdfService.generateCertificatePdfAsync({
        orderNumber: result.order.order_number,
        planName: plan.name,
        carSegment: result.order.car_segment,
        amount: result.order.amount,
        planPeriodMonths: result.order.plan_period_months,
        incidentsAllowed: result.order.incidents_allowed,
        distanceKmAllowed: result.order.distance_km_allowed,
        hotelAccommodationAllowed: result.order.hotel_accommodation_allowed,
        cabServiceAllowed: result.order.cab_service_allowed,
        startDate: result.order.start_date,
        expiryDate: result.order.expiry_date,
        paymentStatus: result.order.payment_status,
        status: result.order.status,
        dealer: {
          formatedId: dealer.formated_id,
          name: dealer.name,
          number: dealer.number,
          email: dealer.email,
          residentialAddress: dealer.residential_address,
        },
        customer: {
          customerName: result.customer.customer_name,
          customerNumber: result.customer.customer_number,
          alternativeNumber: result.customer.alternative_number,
          emailAddress: result.customer.email_address,
          residentialAddress: fullAddress,
          gstNumber: result.customer.gst_number,
        },
        vehicle: {
          regNumber: result.vehicle.vehicle_reg_number,
          make: result.vehicle.vehicle_make,
          model: result.vehicle.vehicle_model,
          fuelType: result.vehicle.vehicle_fuel_type,
          transmissionType: result.vehicle.transmission_type,
          registrationYear: result.vehicle.registration_year,
          chassisNumber: result.vehicle.chassis_number,
          odometerReading: result.vehicle.current_odometer_reading,
          carSegment: result.vehicle.car_segment,
        },
      });

      // Upload PDF to cloud storage
      const uploadedPdf = await this.storageService.uploadFileAsync({
        buffer: pdfBuffer,
        originalName: `${result.order.order_number}.pdf`,
        mimeType: 'application/pdf',
        size: pdfBuffer.length,
        folderPath: 'dealer/package_certificates',
      });

      // Update package_pdf_url on order
      const updatedOrder = await this.prisma.dealer_package_order.update({
        where: { id: result.order.id },
        data: { package_pdf_url: uploadedPdf.url },
        include: {
          customer: true,
          vehicle: true,
        },
      });

      return updatedOrder;
    } catch (pdfErr) {
      this.logger.error('Failed to generate or upload PDF certificate', pdfErr);
      return result.order;
    }
  }

  /**
   * Retrieves paginated packages for the logged-in dealer
   */
  async findAllByDealerAsync(dealerId: number, query: DealerPackageOrderQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.dealer_package_orderWhereInput = {
      dealer_id: dealerId,
    };

    if (query.status) where.status = query.status;
    if (query.payment_status) where.payment_status = query.payment_status;

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { order_number: { contains: term, mode: 'insensitive' } },
        { customer: { customer_name: { contains: term, mode: 'insensitive' } } },
        { customer: { customer_number: { contains: term, mode: 'insensitive' } } },
        { vehicle: { vehicle_reg_number: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.dealer_package_order.count({ where }),
      this.prisma.dealer_package_order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          customer: true,
          vehicle: true,
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single package details for dealer or admin
   */
  async findOneAsync(id: number, dealerId?: number) {
    const order = await this.prisma.dealer_package_order.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        dealer: {
          select: {
            id: true,
            formated_id: true,
            name: true,
            number: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Dealer package order with ID ${id} not found.`);
    }

    if (dealerId && order.dealer_id !== dealerId) {
      throw new ForbiddenException('Access denied to this package order.');
    }

    return order;
  }

  /**
   * Retrieves all packages across all dealers (Admin view)
   */
  async findAllAdminAsync(query: DealerPackageOrderQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.dealer_package_orderWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.payment_status) where.payment_status = query.payment_status;

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { order_number: { contains: term, mode: 'insensitive' } },
        { customer: { customer_name: { contains: term, mode: 'insensitive' } } },
        { customer: { customer_number: { contains: term, mode: 'insensitive' } } },
        { vehicle: { vehicle_reg_number: { contains: term, mode: 'insensitive' } } },
        { dealer: { name: { contains: term, mode: 'insensitive' } } },
        { dealer: { formated_id: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.dealer_package_order.count({ where }),
      this.prisma.dealer_package_order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'desc' },
        include: {
          customer: true,
          vehicle: true,
          dealer: {
            select: {
              id: true,
              formated_id: true,
              name: true,
              number: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin manual update of package usage (hotel stays, cab rides, incidents, notes)
   */
  async updateUsageAsync(id: number, dto: UpdatePackageUsageDto) {
    const order = await this.prisma.dealer_package_order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException(`Dealer package order with ID ${id} not found.`);
    }

    const updateData: Prisma.dealer_package_orderUpdateInput = {};

    if (dto.incidents_used !== undefined) updateData.incidents_used = dto.incidents_used;
    if (dto.hotel_accommodation_used !== undefined) {
      updateData.hotel_accommodation_used = dto.hotel_accommodation_used;
    }
    if (dto.cab_service_used !== undefined) updateData.cab_service_used = dto.cab_service_used;
    if (dto.admin_notes !== undefined) updateData.admin_notes = dto.admin_notes;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.payment_status !== undefined) updateData.payment_status = dto.payment_status;

    const updated = await this.prisma.dealer_package_order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        vehicle: true,
      },
    });

    return updated;
  }
}
