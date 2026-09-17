import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { OrderGateway } from '../order/order.gateway';
import { LeadStatus } from '@prisma/client';
import { FilterLeadDto } from './dto/filter-lead.dto';

import { LeadOrderService } from '../lead-order/lead-order.service';

@Injectable()
export class CustomerLeadService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _orderGateway: OrderGateway,
    private readonly _leadOrderService: LeadOrderService,
  ) {}

  async getAvailableLeads(filterLeadDto: FilterLeadDto) {
    // start_location and end_location will be used for filtering in the future
    const { start_location, end_location } = filterLeadDto;

    return this._prisma.lead.findMany({
      where: { status: LeadStatus.New },
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
      include: { sub_service: { include: { service: true } } },
    });

    if (!lead) throw new NotFoundException('Lead not found');

    if (lead.status !== LeadStatus.New) {
      throw new BadRequestException('This lead has already been booked.');
    }

    const leadOrder = await this._leadOrderService.createLeadOrder(customerId, lead.id);

    const startLocationData = lead.start_location_data as any;
    const endLocationData = lead.end_location_data as any;

    if (lead.driver_id) {
      this._orderGateway.emitNewLeadToDriver(lead.driver_id, {
        lead_id: lead.id,
        lead_formatted_id: lead.formated_id,
        lead_order_formatted_id: leadOrder.formated_id,
        lead_order_id: leadOrder.id,
        start_location: startLocationData,
        end_location: endLocationData,
        service_name: lead.sub_service.service.name,
        sub_service_name: lead.sub_service.name,
      });
    }

    return leadOrder;
  }

  async getLeadOrdersForCustomer(customerId: number) {
    return this._leadOrderService.getLeadOrdersForCustomer(customerId);
  }

  async getLeadOrderById(orderId: number, customerId: number) {
    const order = await this._leadOrderService.getLeadOrderById(orderId);
    if (order.customer_id !== customerId) {
      throw new BadRequestException('You do not have permission to view this lead order');
    }
    return order;
  }

  async getLeadOrderOtpsAsync(orderId: number, customerId: number) {
    return this._leadOrderService.getLeadOrderOtpsForCustomerAsync(orderId, customerId);
  }
}
