import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderListDto } from './dto/order-list.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import {
  OrderStatus,
  LocationCategory,
  LocationType,
  OrderOtpType,
  TransactionType,
} from '@prisma/client';
import { CallerService } from 'src/services/jwt/caller.service';
import { WalletService } from '../wallet/wallet.service';
import { OrderNotificationService } from './order-notification.service';
import { OrderCreationService } from './order-creation.service';
import { StorageService } from 'src/services/storage/storage.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _callerService: CallerService,
    private readonly _walletService: WalletService,
    private readonly _notificationService: OrderNotificationService,
    private readonly _orderCreationService: OrderCreationService,
    private readonly _storageService: StorageService,
  ) { }

  /**
   * Sends a 6-digit OTP to the customer for order start or completion.
   */
  async sendOrderOtpAsync(
    orderId: number,
    type: OrderOtpType,
  ): Promise<{ message: string }> {
    if (!this._callerService.isDriver()) {
      throw new BadRequestException('Only drivers can send order OTPs');
    }

    const driverId = this._callerService.getUserId();
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException(
        'You are not the assigned driver for this order',
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date('9999-12-31'); // No expiration (far future date)

    await this._prisma.order_otp.upsert({
      where: {
        order_id_type: {
          order_id: orderId,
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
        order_id: orderId,
        type: type,
        otp: otpCode,
        expires_at: expiresAt,
      },
    });

    // Update order status to OtpPending
    await this._prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.OtpPending },
    });

    // OTP is now generated and accessible via customer app (no SMS sent)
    return { message: 'OTP generated successfully' };
  }

  /**
   * Verifies the OTP provided by the driver and updates order status.
   */
  async verifyOrderOtpAsync(
    orderId: number,
    type: OrderOtpType,
    otp: string,
  ): Promise<{ message: string }> {
    if (!this._callerService.isDriver()) {
      throw new BadRequestException('Only drivers can verify order OTPs');
    }

    const driverId = this._callerService.getUserId();
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException(
        'You are not the assigned driver for this order',
      );
    }

    const otpRecord = await this._prisma.order_otp.findUnique({
      where: {
        order_id_type: {
          order_id: orderId,
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

    if (new Date() > otpRecord.expires_at) {
      throw new BadRequestException('OTP has expired');
    }

    if (otpRecord.otp !== otp) {
      // Increment attempts
      await this._prisma.order_otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP');
    }

    // Perform verification and status update within a database transaction context
    const updateData: any = {
      status:
        type === OrderOtpType.BREAKDOWN
          ? OrderStatus.InProgress
          : OrderStatus.Completed,
    };

    if (type === OrderOtpType.BREAKDOWN) {
      updateData.start_time = new Date();
    } else {
      updateData.completion_time = new Date();
    }

    await this._prisma.$transaction(async (tx) => {
      // Mark as verified
      await tx.order_otp.update({
        where: { id: otpRecord.id },
        data: {
          is_verified: true,
          verified_at: new Date(),
        },
      });

      // Update Order Status and Timeline
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          voucher: true,
        },
      });

      // If completing order and a voucher was applied, credit the creator's wallet with ₹75
      if (type !== OrderOtpType.BREAKDOWN && updatedOrder.voucher) {
        await this._walletService.updateWallet(
          updatedOrder.voucher.user_id,
          75.0,
          TransactionType.CREDIT,
          tx,
        );
      }
    });

    return { message: 'OTP verified successfully.' };
  }

  /**
   * Creates a new order with breakdown and drop locations.
   * This is an atomic operation.
   * @param dto Order creation data
   */
  /**
   * Creates a new order for the currently authenticated customer.
   * Resolves the caller identity from JWT context and delegates to the
   * context-free {@link createForCustomerAsync} method.
   */
  async createAsync(dto: CreateOrderDto): Promise<OrderDetailDto> {
    const customerId = this._callerService.getUserId();
    return this.createForCustomerAsync(customerId, dto);
  }

  /**
   * Creates a new order for an explicitly provided customer ID.
   *
   * This is the canonical order-creation method. It is intentionally decoupled
   * from the HTTP request context so it can be safely called from:
   *  - The REST controller (via {@link createAsync})
   *  - The scheduled-order processor (headless, no CallerService available)
   *
   * @param customerId - ID of the customer who owns the order
   * @param dto - Full order creation payload
   * @param scheduledOrderId - Optional FK to the scheduled_order row that triggered this creation
   */
  async createForCustomerAsync(
    customerId: number,
    dto: CreateOrderDto,
    scheduledOrderId?: number,
  ): Promise<OrderDetailDto> {
    return this._orderCreationService.createForCustomerAsync(
      customerId,
      dto,
      scheduledOrderId,
    );
  }

  /**
   * Gets a list of orders.
   */
  async getListAsync(): Promise<OrderListDto[]> {
    return this._prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        formated_id: true,
        customer_id: true,
        service_id: true,
        sub_service_id: true,
        service: true,
        sub_service: true,
        fleet_type: true,
        status: true,
        created_at: true,
      },
    });
  }

  /**
   * Gets order details by ID.
   * @param id Order ID
   */
  async getByIdAsync(id: number): Promise<OrderDetailDto> {
    const order = await this._prisma.order.findUnique({
      where: { id },
      include: {
        locations: true,
        customer: true,
        driver: true,
        vehicle: true,
        vendor: true,
        service: true,
        sub_service: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order as unknown as OrderDetailDto;
  }

  /**
   * Allows a driver to accept an order.
   * @param id Order ID
   */
  async acceptOrderAsync(id: number): Promise<OrderDetailDto> {
    if (!this._callerService.isDriver()) {
      throw new BadRequestException('Only drivers can accept orders');
    }

    const driverId = this._callerService.getUserId();
    const order = await this._prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status !== OrderStatus.New) {
      throw new BadRequestException(
        `Order is already ${order.status.toLowerCase()}`,
      );
    }

    const driver = await this._prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver profile not found`);
    }

    try {
      await this._prisma.$transaction(async (tx) => {
        // 1. Update Order Status and Driver/Vehicle Assignment
        await tx.order.update({
          where: { id },
          data: {
            driver_id: driver.id,
            vehicle_id: driver.vehicle_id,
            vendor_id: driver.vendor_id,
            status: OrderStatus.OtpPending,
            assign_time: new Date(),
          },
        });

        // 2. Link Driver Locations (Start and End)
        const orderLocations: any[] = [];

        if (driver.startLocation) {
          orderLocations.push({
            order_id: id,
            type: LocationType.Start,
            address: driver.startLocation.address,
            street: driver.startLocation.street,
            area: driver.startLocation.area,
            city: driver.startLocation.city,
            state: driver.startLocation.state,
            pincode: driver.startLocation.pincode,
            country: driver.startLocation.country,
            latitude: driver.startLocation.latitude,
            longitude: driver.startLocation.longitude,
            landmark: driver.startLocation.landmark,
            place_id: driver.startLocation.place_id,
          });
        }

        if (driver.endLocation) {
          orderLocations.push({
            order_id: id,
            type: LocationType.End,
            address: driver.endLocation.address,
            street: driver.endLocation.street,
            area: driver.endLocation.area,
            city: driver.endLocation.city,
            state: driver.endLocation.state,
            pincode: driver.endLocation.pincode,
            country: driver.endLocation.country,
            latitude: driver.endLocation.latitude,
            longitude: driver.endLocation.longitude,
            landmark: driver.endLocation.landmark,
            place_id: driver.endLocation.place_id,
          });
        }

        if (orderLocations.length > 0) {
          // Clean up any existing Start/End locations for this order just in case
          await tx.order_location.deleteMany({
            where: {
              order_id: id,
              type: { in: [LocationType.Start, LocationType.End] },
            },
          });

          await tx.order_location.createMany({
            data: orderLocations,
          });
        }
      });

      // 3. Directly call the OTP sending logic with type START
      await this.sendOrderOtpAsync(id, OrderOtpType.BREAKDOWN);

      // 4. Return the updated order details
      return (await this._prisma.order.findUnique({
        where: { id },
        include: {
          locations: true,
          service: true,
          sub_service: true,
        },
      })) as unknown as OrderDetailDto;
    } catch (error) {
      console.error('Error accepting order:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to accept order. Please try again.',
      );
    }
  }

  /**
   * Allows a driver to cancel an active order.
   * Resets status back to 'New' and clears the assigned driver/vehicle/vendor and locations.
   * @param id Order ID
   * @param reason Optional reason for cancellation
   */
  async cancelOrderAsync(id: number, reason?: string): Promise<OrderDetailDto> {
    if (!this._callerService.isDriver()) {
      throw new BadRequestException('Only drivers can cancel orders');
    }

    const driverId = this._callerService.getUserId();
    const order = await this._prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException(
        'You are not the assigned driver for this order',
      );
    }

    if (
      order.status !== OrderStatus.OtpPending &&
      order.status !== OrderStatus.InProgress
    ) {
      throw new BadRequestException(
        `Cannot cancel an order in ${order.status.toLowerCase()} status`,
      );
    }

    try {
      return await this._prisma.$transaction(async (tx) => {
        // 1. Reset Order details
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            driver_id: null,
            vehicle_id: null,
            vendor_id: null,
            status: OrderStatus.New,
            assign_time: null,
            cancel_reason: reason ?? null,
          },
        });

        // 2. Remove Driver Start and End locations
        await tx.order_location.deleteMany({
          where: {
            order_id: id,
            type: { in: [LocationType.Start, LocationType.End] },
          },
        });

        // 3. Remove order OTPs
        await tx.order_otp.deleteMany({
          where: { order_id: id },
        });

        return (await tx.order.findUnique({
          where: { id: updatedOrder.id },
          include: {
            locations: true,
            service: true,
            sub_service: true,
          },
        })) as unknown as OrderDetailDto;
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to cancel order. Please try again.',
      );
    }
  }

  /**
   * Fetches all pending orders (status: 'New') in the system for drivers.
   */
  async getPendingOrdersForDriverAsync(): Promise<OrderDetailDto[]> {
    if (!this._callerService.isDriver()) {
      throw new BadRequestException('Only drivers can access pending orders');
    }

    const orders = await this._prisma.order.findMany({
      where: {
        status: OrderStatus.New,
      },
      include: {
        locations: true,
        customer: true,
        customer_vehicle: true,
        service: true,
        sub_service: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    orders.forEach((order) => {
      order['breakdown_location'] = order.locations.find(
        (loc) => loc.type === LocationType.Breakdown,
      );
      order['dropoff_location'] = order.locations.find(
        (loc) => loc.type === LocationType.Drop,
      );
      order.locations = [];
    });

    return orders as unknown as OrderDetailDto[];
  }

  /**
   * Gets details of a specific order for a driver by its ID.
   * A driver can view the order if its status is 'New' (pending) or if they are the assigned driver.
   * @param id Order ID
   */
  async getOrderByIdForDriverAsync(id: number): Promise<OrderDetailDto> {
    if (!this._callerService.isDriver()) {
      throw new BadRequestException('Only drivers can access order details');
    }

    const driverId = this._callerService.getUserId();
    const order = await this._prisma.order.findUnique({
      where: { id },
      include: {
        locations: true,
        customer: true,
        customer_vehicle: true,
        driver: true,
        vehicle: true,
        vendor: true,
        service: true,
        sub_service: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // A driver can access an order if it is pending (New) or assigned to them
    if (order.status !== OrderStatus.New && order.driver_id !== driverId) {
      throw new BadRequestException(
        'You do not have permission to view this order',
      );
    }

    order['breakdown_location'] = order.locations.find(
      (loc) => loc.type === LocationType.Breakdown,
    );
    order['dropoff_location'] = order.locations.find(
      (loc) => loc.type === LocationType.Drop,
    );

    order['locations'] = [];

    return order as unknown as OrderDetailDto;
  }

  /**
   * Uploads multiple pre-pickup or post-pickup images for an order.
   * Only the assigned driver can upload these images.
   */
  async uploadOrderImagesAsync(
    orderId: number,
    type: 'pre_pickup' | 'post_pickup' | 'dropoff',
    files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    if (!this._callerService.isDriver()) {
      throw new BadRequestException('Only drivers can upload order images');
    }

    const driverId = this._callerService.getUserId();
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException(
        'You are not the assigned driver for this order',
      );
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
            folderPath: `order/${orderId}/${folderType}/${index}`,
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

    await this._prisma.order.update({
      where: { id: orderId },
      data: {
        [fieldName]: urls,
      },
    });

    return { urls };
  }

  /**
   * Uploads a physical VCRF image for an order when EVCRF is not used.
   * Only the assigned driver can upload these images.
   */
  async uploadPhysicalVcrfImageAsync(
    orderId: number,
    type: 'pickup' | 'dropoff',
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    if (!this._callerService.isDriver()) {
      throw new BadRequestException(
        'Only drivers can upload physical VCRF images',
      );
    }

    const driverId = this._callerService.getUserId();
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException(
        'You are not the assigned driver for this order',
      );
    }

    if (type === 'pickup' && !order.is_physical_vcrf_for_pickup) {
      throw new BadRequestException(
        'An EVCRF has already been filled for pickup',
      );
    }

    if (type === 'dropoff' && !order.is_physical_vcrf_for_dropoff) {
      throw new BadRequestException(
        'An EVCRF has already been filled for dropoff',
      );
    }

    if (!file) {
      throw new BadRequestException('No file was provided for upload');
    }

    const res = await this._storageService.uploadFileAsync({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      folderPath: `order/${orderId}/physical-vcrf/${type}`,
    });

    const fieldName =
      type === 'pickup'
        ? 'physical_pickup_vcrf_image'
        : 'physical_dropoff_vcrf_image';

    await this._prisma.$transaction(async (tx) => {
      // If uploading a physical pickup VCRF, safely delete any existing EVCRF (and its damages via cascade)
      if (type === 'pickup') {
        await tx.pickup_evcrf.deleteMany({
          where: { order_id: orderId },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          [fieldName]: res.url,
          ...(type === 'pickup' && { is_physical_vcrf_for_pickup: true }),
        },
      });
    });

    return { url: res.url };
  }

  /**
   * Gets OTPs for a specific order (For Customers)
   */
  async getOrderOtpsAsync(orderId: number) {
    if (!this._callerService.isCustomer()) {
      throw new BadRequestException('Only customers can view order OTPs');
    }

    const customerId = this._callerService.getUserId();
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      include: { otps: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.customer_id !== customerId) {
      throw new BadRequestException('You do not have permission to view OTPs for this order');
    }

    return order.otps;
  }
}
