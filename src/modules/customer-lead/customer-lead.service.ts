import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { OrderGateway } from '../order/order.gateway';
import { OrderStatus, OrderType, LocationType } from '@prisma/client';
import { FilterLeadDto } from './dto/filter-lead.dto';

@Injectable()
export class CustomerLeadService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _orderGateway: OrderGateway,
  ) {}

  async getAvailableLeads(filterLeadDto: FilterLeadDto) {
    // start_location and end_location will be used for filtering in the future
    const { start_location, end_location } = filterLeadDto;

    return this._prisma.lead.findMany({
      where: { order: null },
      include: {
        vendor: {
          select: { vendor_name: true, organization_name: true },
        },
        vehicle: true,
        sub_service: true,
      },
    });
  }

  async bookLead(customerId: number, leadId: number) {
    const lead = await this._prisma.lead.findUnique({
      where: { id: leadId },
      include: { sub_service: true },
    });

    if (!lead) throw new NotFoundException('Lead not found');

    const existingOrder = await this._prisma.order.findUnique({
      where: { lead_id: leadId },
    });
    if (existingOrder) throw new BadRequestException('This lead has already been booked.');

    const startLocationData = lead.start_location_data as any;
    const endLocationData = lead.end_location_data as any;

    const order = await this._prisma.order.create({
      data: {
        formated_id: '', 
        customer_id: customerId,
        vendor_id: lead.vendor_id,
        vehicle_id: lead.vehicle_id,
        service_id: lead.sub_service.service_id,
        sub_service_id: lead.sub_service_id,
        fleet_type: lead.sub_service_id,
        type: OrderType.Lead,
        status: OrderStatus.Assigned,
        lead_id: lead.id,
        final_amount: lead.lead_amount,
        start_time: lead.activation_time,
        locations: {
          create: [
            {
              type: LocationType.Start,
              address: startLocationData.address || startLocationData.formatted_address,
              latitude: startLocationData.latitude || startLocationData.geometry?.location?.lat,
              longitude: startLocationData.longitude || startLocationData.geometry?.location?.lng,
              place_id: lead.start_location,
            },
            {
              type: LocationType.Drop,
              address: endLocationData.address || endLocationData.formatted_address,
              latitude: endLocationData.latitude || endLocationData.geometry?.location?.lat,
              longitude: endLocationData.longitude || endLocationData.geometry?.location?.lng,
              place_id: lead.end_location,
            },
          ],
        },
      },
    });

    const driver = await this._prisma.driver.findFirst({
      where: { vehicle_id: lead.vehicle_id },
    });

    if (driver) {
      this._orderGateway.notifySpecificDriver(driver.id, {
        orderId: order.id,
        amount: order.final_amount,
        type: order.type,
      });
    }

    return order;
  }
}
