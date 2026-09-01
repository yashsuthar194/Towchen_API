import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadService {
  constructor(private readonly _prismaService: PrismaService) {}

  async create(vendorId: number, createLeadDto: CreateLeadDto) {
    const { tag_locations, ...leadData } = createLeadDto;

    // Verify the vehicle belongs to the vendor
    const vehicle = await this._prismaService.vehicle.findFirst({
      where: { id: leadData.vehicle_id, vendor_id: vendorId }
    });

    if (!vehicle) {
      throw new BadRequestException('Selected vehicle does not belong to this vendor.');
    }

    // Build the nested creation payload for tag locations
    const tagLocationsData = tag_locations?.map((address, index) => ({
      address,
      order: index + 1
    })) || [];

    // Create the lead and associated tag locations in a single transaction
    const newLead = await this._prismaService.lead.create({
      data: {
        ...leadData,
        vendor_id: vendorId,
        activation_time: leadData.activation_time ? new Date(leadData.activation_time) : null,
        tag_locations: {
          create: tagLocationsData
        }
      },
      include: {
        tag_locations: true
      }
    });

    return newLead;
  }
}
