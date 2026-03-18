import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderListDto } from './dto/order-list.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import { OrderStatus, LocationCategory, LocationType } from '@prisma/client';
import { CallerService } from 'src/services/jwt/caller.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _callerService: CallerService,
  ) {}

  /**
   * Creates a new order with breakdown and drop locations.
   * This is an atomic operation.
   * @param dto Order creation data
   */
  async createAsync(dto: CreateOrderDto): Promise<OrderDetailDto> {
    try {
      return await this._prisma.$transaction(async (tx) => {
        // 1. Create Breakdown Location
        const breakdownLocation = await tx.location.create({
          data: {
            ...dto.breakdown_location,
            category: LocationCategory.Order,
          },
        });

        // 2. Create Drop Location
        const dropLocation = await tx.location.create({
          data: {
            ...dto.drop_location,
            category: LocationCategory.Order,
          },
        });

        // 3. Create Order
        const order = await tx.order.create({
          data: {
            customer_id: dto.customer_id,
            customer_vehicle_id: dto.customer_vehicle_id,
            service_type: dto.service_type,
            fleet_type: dto.fleet_type,
            status: OrderStatus.New,
            formated_id: '', // Handled by DB trigger
          },
        });

        // 4. Link Locations to Order
        await tx.order_location.createMany({
          data: [
            {
              order_id: order.id,
              location_id: breakdownLocation.id,
              type: LocationType.Breakdown,
              contact_name: dto.breakdown_contact_name,
              contact_number: dto.breakdown_contact_number,
            },
            {
              order_id: order.id,
              location_id: dropLocation.id,
              type: LocationType.Drop,
              contact_name: dto.drop_contact_name,
              contact_number: dto.drop_contact_number,
            },
          ],
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
        service_type: true,
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
      return await this._prisma.$transaction(async (tx) => {
        // 1. Update Order Status and Driver/Vehicle Assignment
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            driver_id: driver.id,
            vehicle_id: driver.vehicle_id,
            vendor_id: driver.vendor_id,
            status: OrderStatus.Assigned,
            assign_time: new Date(),
          },
        });

        // 2. Link Driver Locations (Start and End)
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

        return await tx.order.findUnique({
          where: { id: updatedOrder.id },
          include: {
            locations: {
              include: { location: true },
            },
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
