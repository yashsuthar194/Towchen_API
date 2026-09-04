import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LocationCategory } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { MapsService } from 'src/services/maps/maps.service';
import { CreateServiceLocationDto } from './dto/create-service-location.dto';
import { UpsertLocationPricingDto } from './dto/upsert-location-pricing.dto';
import { ServiceLocationDto } from './dto/service-location.dto';

@Injectable()
export class ServiceLocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapsService: MapsService,
  ) {}

  // ─── List ────────────────────────────────────────────────────────────────────

  /**
   * Returns all active ServiceArea locations (used by the vendor registration form).
   * Includes the pricing ceilings configured for each location.
   */
  async findAllAsync(): Promise<ServiceLocationDto[]> {
    const locations = await this.prisma.location.findMany({
      where: { category: LocationCategory.ServiceArea },
      include: {
        location_pricings: {
          include: {
            sub_service: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Map the internal location record to the response DTO shape
    return locations.map((l) => this.toDto(l));
  }

  /**
   * Returns a single ServiceArea location by ID, or throws 404.
   */
  async findOneAsync(id: number): Promise<ServiceLocationDto> {
    const location = await this.prisma.location.findFirst({
      where: { id, category: LocationCategory.ServiceArea },
      include: {
        location_pricings: {
          include: {
            sub_service: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Service location with ID ${id} not found`);
    }

    return this.toDto(location);
  }

  // ─── Create ──────────────────────────────────────────────────────────────────

  /**
   * Admin creates a new ServiceArea location from a Google Place ID.
   * The backend resolves lat/lng and address automatically from Google Maps.
   * The human-readable name is stored in the `description` field.
   */
  async createAsync(dto: CreateServiceLocationDto): Promise<ServiceLocationDto> {
    // Resolve place_id → full address + coordinates using the shared MapsService
    const resolved = await this.mapsService.resolveAddressByPlaceIdAsync(
      dto.place_id,
    );

    const location = await this.prisma.location.create({
      data: {
        // Use the Prisma-generated enum instead of a raw string
        category: LocationCategory.ServiceArea,
        description: dto.name,   // admin-given name stored in description
        place_id: dto.place_id,
        address: resolved.address,
        area: resolved.area,
        city: resolved.city,
        state: resolved.state,
        pincode: resolved.pincode,
        country: resolved.country,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
      },
      include: {
        location_pricings: {
          include: {
            sub_service: true,
          },
        },
      },
    });

    return this.toDto(location);
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  /**
   * Admin updates the human-readable name of a ServiceArea location.
   * lat/lng and address are not re-resolved here — delete and recreate for a new location.
   */
  async updateNameAsync(id: number, name: string): Promise<ServiceLocationDto> {
    // Verify the location exists and is a ServiceArea
    await this.findOneAsync(id);

    const updated = await this.prisma.location.update({
      where: { id },
      data: { description: name },
      include: {
        location_pricings: {
          include: {
            sub_service: true,
          },
        },
      },
    });

    return this.toDto(updated);
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  /**
   * Soft-deletes a ServiceArea location by removing it from the ServiceArea category.
   * Existing vendors linked to this location are not affected.
   */
  async deleteAsync(id: number): Promise<void> {
    await this.findOneAsync(id); // throws 404 if not found

    // Change category so it no longer appears in service area queries
    // (we don't hard-delete to preserve referential integrity with vendors)
    await this.prisma.location.update({
      where: { id },
      data: { category: LocationCategory.Driver }, // effectively removes it from ServiceArea list
    });
  }

  // ─── Pricing Ceiling CRUD ────────────────────────────────────────────────────

  /**
   * Returns all pricing ceilings configured for a given service area location.
   */
  async getPricingsAsync(locationId: number): Promise<ServiceLocationDto> {
    return this.findOneAsync(locationId);
  }

  /**
   * Admin sets the price ceiling for a specific sub-service in a location.
   */
  async createPricingAsync(
    locationId: number,
    dto: UpsertLocationPricingDto,
  ): Promise<void> {
    // Confirm location exists before creating a pricing row
    await this.findOneAsync(locationId);

    // Confirm the sub-service exists
    const subService = await this.prisma.sub_service.findUnique({
      where: { id: dto.sub_service_id },
    });
    if (!subService) {
      throw new BadRequestException(
        `Sub-service with ID ${dto.sub_service_id} not found`,
      );
    }

    const existing = await this.prisma.location_pricing.findUnique({
      where: {
        location_id_sub_service_id: {
          location_id: locationId,
          sub_service_id: dto.sub_service_id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Pricing ceiling already exists for this sub-service in this location');
    }

    await this.prisma.location_pricing.create({
      data: {
        location_id: locationId,
        sub_service_id: dto.sub_service_id,
        base_distance: dto.base_distance,
        base_price: dto.base_price,
        extra_distance_price: dto.extra_distance_price,
      },
    });
  }

  /**
   * Admin updates the price ceiling for a specific sub-service in a location.
   */
  async updatePricingAsync(
    locationId: number,
    dto: UpsertLocationPricingDto,
  ): Promise<void> {
    const existing = await this.prisma.location_pricing.findUnique({
      where: {
        location_id_sub_service_id: {
          location_id: locationId,
          sub_service_id: dto.sub_service_id,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Pricing ceiling not found for this sub-service in this location');
    }

    await this.prisma.location_pricing.update({
      where: {
        location_id_sub_service_id: {
          location_id: locationId,
          sub_service_id: dto.sub_service_id,
        },
      },
      data: {
        base_distance: dto.base_distance,
        base_price: dto.base_price,
        extra_distance_price: dto.extra_distance_price,
      },
    });
  }

  /**
   * Admin removes the pricing ceiling for a specific sub-service in a location.
   * After removal, vendors in that location fall back to sub_service global defaults.
   */
  async deletePricingAsync(
    locationId: number,
    subServiceId: number,
  ): Promise<void> {
    const existing = await this.prisma.location_pricing.findUnique({
      where: {
        location_id_sub_service_id: {
          location_id: locationId,
          sub_service_id: subServiceId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Pricing ceiling for sub-service ${subServiceId} in location ${locationId} not found`,
      );
    }

    await this.prisma.location_pricing.delete({
      where: {
        location_id_sub_service_id: {
          location_id: locationId,
          sub_service_id: subServiceId,
        },
      },
    });
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  /**
   * Maps a Prisma location row (with location_pricings) to the response DTO.
   * The description field is used as the human-readable name for ServiceArea locations.
   */
  private toDto(location: any): ServiceLocationDto {
    return {
      id: location.id,
      name: location.description ?? '',
      place_id: location.place_id,
      address: location.address ?? '',
      area: location.area,
      city: location.city ?? '',
      state: location.state ?? '',
      pincode: location.pincode,
      latitude: location.latitude,
      longitude: location.longitude,
      location_pricings: location.location_pricings?.map((lp: any) => ({
        id: lp.id,
        location_id: lp.location_id,
        sub_service_id: lp.sub_service_id,
        sub_service_name: lp.sub_service?.name,
        base_distance: lp.base_distance,
        base_price: lp.base_price,
        extra_distance_price: lp.extra_distance_price,
        created_at: lp.created_at,
        updated_at: lp.updated_at,
      })),
      created_at: location.created_at,
    };
  }
}
