import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderListDto } from './dto/order-list.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import { OrderStatus, LocationCategory, LocationType, OrderOtpType, TransactionType } from '@prisma/client';
import { CallerService } from 'src/services/jwt/caller.service';
import { MapsService } from 'src/services/maps/maps.service';
import { LocationResponseDto } from '../location/dto/location-response.dto';
import { VoucherService } from '../voucher/voucher.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _callerService: CallerService,
    private readonly _mapsService: MapsService,
    private readonly _voucherService: VoucherService,
    private readonly _walletService: WalletService,
  ) { }

  /**
   * Sends a 6-digit OTP to the customer for order start or completion.
   */
  async sendOrderOtpAsync(orderId: number, type: OrderOtpType): Promise<{ message: string }> {
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
      throw new BadRequestException('You are not the assigned driver for this order');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

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

    // TODO: Integrate with SMS service to send OTP to order.customer.number
    console.log(`Sending OTP ${otpCode} to customer ${order.customer.number} for order ${orderId} (${type})`);

    return { message: `OTP sent successfully to ${order.customer.number}` };
  }

  /**
   * Verifies the OTP provided by the driver and updates order status.
   */
  async verifyOrderOtpAsync(orderId: number, type: OrderOtpType, otp: string): Promise<{ message: string }> {
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
      throw new BadRequestException('You are not the assigned driver for this order');
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
      status: type === OrderOtpType.START ? OrderStatus.InProgress : OrderStatus.Completed,
    };

    if (type === OrderOtpType.START) {
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
          voucher: true
        }
      });

      // If completing order and a voucher was applied, credit the creator's wallet with ₹75
      if (type !== OrderOtpType.START && updatedOrder.voucher) {
        await this._walletService.updateWallet(
          updatedOrder.voucher.user_id,
          75.0,
          TransactionType.CREDIT,
          tx
        );
      }
    });

    return { message: `OTP verified successfully. Order is now ${updateData.status.toLowerCase()}.` };
  }

  /**
   * Creates a new order with breakdown and drop locations.
   * This is an atomic operation.
   * @param dto Order creation data
   */
  async createAsync(dto: CreateOrderDto): Promise<OrderDetailDto> {
    try {
      const customerId = this._callerService.getUserId();

      if (!dto.sub_service_id) {
        throw new BadRequestException('sub_service_id cannot be empty');
      }

      // Query sub_service to check journey_type
      const subService = await this._prisma.sub_service.findUnique({
        where: { id: dto.sub_service_id },
      });

      if (!subService) {
        throw new NotFoundException(`Sub-service with ID ${dto.sub_service_id} not found`);
      }

      const isFourWay = subService.journey_type === 'FourWay';

      if (isFourWay && !dto.drop_location) {
        throw new BadRequestException('drop_location is required for FourWay journey sub-services');
      }

      // Resolve breakdown location
      const breakdownAddress = await this._mapsService.resolveAddressByPlaceIdAsync(dto.breakdown_location.place_id);

      // Resolve drop location only if FourWay and provided
      let dropAddress: LocationResponseDto | null = null;
      if (isFourWay && dto.drop_location) {
        dropAddress = await this._mapsService.resolveAddressByPlaceIdAsync(dto.drop_location.place_id);
      }

      return await this._prisma.$transaction(async (tx) => {
        // 1. Create Breakdown Location from resolved address
        const breakdownLocation = await tx.location.create({
          data: {
            address: breakdownAddress.address,
            street: breakdownAddress.street,
            area: breakdownAddress.area,
            city: breakdownAddress.city,
            state: breakdownAddress.state,
            pincode: breakdownAddress.pincode,
            country: breakdownAddress.country,
            latitude: breakdownAddress.latitude,
            longitude: breakdownAddress.longitude,
            landmark: breakdownAddress.landmark,
            place_id: dto.breakdown_location.place_id,
            category: LocationCategory.Order,
          },
        });

        // 2. Create Drop Location from resolved address if FourWay
        let dropLocation: { id: number } | null = null;
        if (isFourWay && dropAddress && dto.drop_location) {
          dropLocation = await tx.location.create({
            data: {
              address: dropAddress.address,
              street: dropAddress.street,
              area: dropAddress.area,
              city: dropAddress.city,
              state: dropAddress.state,
              pincode: dropAddress.pincode,
              country: dropAddress.country,
              latitude: dropAddress.latitude,
              longitude: dropAddress.longitude,
              landmark: dropAddress.landmark,
              place_id: dto.drop_location.place_id,
              category: LocationCategory.Order,
            },
          });
        }

        // 3. Create Order with Voucher and Billing discounts
        let appliedVoucherId: number | null = null;
        let discountAmount = 0.0;
        let finalAmount = dto.sub_service_estimate?.grand_total_int 
          ? parseFloat(dto.sub_service_estimate.grand_total_int) 
          : null;

        if (dto.voucher_code) {
          // Validate voucher (checks existence, expiry, and self-referral)
          const voucher = await this._voucherService.validateVoucherAsync(dto.voucher_code, customerId);
          appliedVoucherId = voucher.id;

          // Compute percentage-based discount on base price (total_price -> final_amount_int)
          const basePrice = dto.sub_service_estimate?.final_amount_int 
            ? parseFloat(dto.sub_service_estimate.final_amount_int) 
            : 0.0;
          discountAmount = parseFloat((basePrice * (voucher.discount_percent / 100)).toFixed(2));

          const grandTotal = dto.sub_service_estimate?.grand_total_int 
            ? parseFloat(dto.sub_service_estimate.grand_total_int) 
            : 0.0;
          finalAmount = Math.max(0, parseFloat((grandTotal - discountAmount).toFixed(2)));

          // Redeem voucher atomically inside order creation transaction context
          await this._voucherService.redeemVoucherAsync(dto.voucher_code, customerId, tx);
        }

        const order = await tx.order.create({
          data: {
            customer_id: customerId,
            customer_vehicle_id: dto.customer_vehicle_id,
            service_id: dto.service_id,
            sub_service_id: dto.sub_service_id,
            fleet_type: dto.sub_service_id, // Maps sub_service_id to fleet_type
            status: OrderStatus.New,
            formated_id: '', // Handled by DB trigger
            applied_voucher_id: appliedVoucherId,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            meta_data: dto.sub_service_estimate ? { sub_service: dto.sub_service_estimate } : undefined,
          },
        });

        // 4. Link Locations to Order dynamically
        const orderLocationsToCreate: {
          order_id: number;
          location_id: number;
          type: LocationType;
          contact_name?: string;
          contact_number?: string;
        }[] = [
          {
            order_id: order.id,
            location_id: breakdownLocation.id,
            type: LocationType.Breakdown,
            contact_name: dto.breakdown_contact_name,
            contact_number: dto.breakdown_contact_number,
          },
        ];

        if (isFourWay && dropLocation) {
          orderLocationsToCreate.push({
            order_id: order.id,
            location_id: dropLocation.id,
            type: LocationType.Drop,
            contact_name: dto.drop_contact_name,
            contact_number: dto.drop_contact_number,
          });
        }

        await tx.order_location.createMany({
          data: orderLocationsToCreate,
        });

        return await tx.order.findUnique({
          where: { id: order.id },
          include: {
            locations: {
              include: { location: true },
            },
          },
        }) as unknown as OrderDetailDto;
      });
    } catch (error) {
      console.error('Error creating order:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create order. Please try again.');
    }
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
        locations: {
          include: { location: true },
        },
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
      throw new BadRequestException(`Order is already ${order.status.toLowerCase()}`);
    }

    const driver = await this._prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        vehicle: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver profile not found`);
    }

    try {
      // Generate 6-digit OTP for START
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

      return await this._prisma.$transaction(async (tx) => {
        // 1. Update Order Status and Driver/Vehicle Assignment
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            driver_id: driver.id,
            vehicle_id: driver.vehicle_id,
            vendor_id: driver.vendor_id,
            status: OrderStatus.OtpPending,
            assign_time: new Date(),
          },
        });

        // 2. Create/Update Order OTP record
        await tx.order_otp.upsert({
          where: {
            order_id_type: {
              order_id: id,
              type: OrderOtpType.START,
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
            order_id: id,
            type: OrderOtpType.START,
            otp: otpCode,
            expires_at: expiresAt,
          },
        });

        // 3. Link Driver Locations (Start and End)
        const orderLocations: any[] = [];

        if (driver.start_location_id) {
          orderLocations.push({
            order_id: id,
            location_id: driver.start_location_id,
            type: LocationType.Start,
          });
        }

        if (driver.end_location_id) {
          orderLocations.push({
            order_id: id,
            location_id: driver.end_location_id,
            type: LocationType.End,
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

        // TODO: Integrate with SMS service to send OTP to order.customer.number
        console.log(`Sending automated START OTP ${otpCode} to customer ${order.customer.number} for order ${id}`);

        return await tx.order.findUnique({
          where: { id: updatedOrder.id },
          include: {
            locations: {
              include: { location: true },
            },
            service: true,
            sub_service: true,
          },
        }) as unknown as OrderDetailDto;
      });
    } catch (error) {
      console.error('Error accepting order:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to accept order. Please try again.');
    }
  }
}
