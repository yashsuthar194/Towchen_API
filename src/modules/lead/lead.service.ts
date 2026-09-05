import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { MapsService } from 'src/services/maps/maps.service';
import { LeadDispatchType } from '@prisma/client';

@Injectable()
export class LeadService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _mapsService: MapsService,
  ) {}

  async create(vendorId: number, createLeadDto: CreateLeadDto) {
    const { tag_locations, ...leadData } = createLeadDto;

    // Verify the vehicle belongs to the vendor
    const vehicle = await this._prismaService.vehicle.findFirst({
      where: { id: leadData.vehicle_id, vendor_id: vendorId }
    });

    if (!vehicle) {
      throw new BadRequestException('Selected vehicle does not belong to this vendor.');
    }

    // Resolve location data using MapsService
    const startLocationData = await this._mapsService.resolveAddressByPlaceIdAsync(leadData.start_location);
    const endLocationData = await this._mapsService.resolveAddressByPlaceIdAsync(leadData.end_location);

    // Determine activation_time based on dispatch_type
    const activationTime =
      leadData.dispatch_type === LeadDispatchType.Scheduled
        ? new Date(leadData.activation_time!)
        : new Date();

    // Create the lead
    const newLead = await this._prismaService.lead.create({
      data: {
        ...leadData,
        vendor_id: vendorId,
        activation_time: activationTime,
        start_location_data: startLocationData as any,
        end_location_data: endLocationData as any,
        tag_locations: tag_locations || [],
      },
    });

    return newLead;
  }

  async calculateRoute(startLocation: string, endLocation: string) {
    const distanceMatrix = await this._mapsService.getDistanceMatrixAsync(
      startLocation,
      endLocation
    );

    return {
      distance: distanceMatrix.distance.formatted,
      time: distanceMatrix.travel_time.formatted,
    };
  }
}
