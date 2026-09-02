import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CallerService } from 'src/services/jwt/caller.service';
import { UpdateVendorPricingDto } from './dto/update-vendor-pricing.dto';
import { VendorPricingDto, VendorPricingWithCeilingDto } from './dto/vendor-pricing.dto';

@Injectable()
export class VendorPricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly callerService: CallerService,
  ) {}

  /**
   * Returns a distinct list of all ServiceArea locations assigned to the vendor's drivers.
   */
  async getMyLocationsAsync() {
    const vendorId = this.callerService.getUserId();

    const drivers = await this.prisma.driver.findMany({
      where: { vendor_id: vendorId, is_deleted: false, service_location_id: { not: null } },
      select: { serviceLocation: true },
    });

    const locationMap = new Map<number, any>();
    for (const d of drivers) {
      if (d.serviceLocation && !locationMap.has(d.serviceLocation.id)) {
        locationMap.set(d.serviceLocation.id, d.serviceLocation);
      }
    }

    return Array.from(locationMap.values());
  }

  /**
   * Returns all pricing rows for the currently authenticated vendor.
   * Each row is enriched with the location's ceiling values so the frontend
   * can show the vendor how much room they have to increase or decrease.
   */
  async getMyPricingAsync(): Promise<VendorPricingWithCeilingDto[]> {
    const vendorId = this.callerService.getUserId();

    // 1. Find all distinct service_locations where the vendor has drivers
    const drivers = await this.prisma.driver.findMany({
      where: { vendor_id: vendorId, is_deleted: false, service_location_id: { not: null } },
      select: { service_location_id: true },
    });

    const locationIds = Array.from(new Set(drivers.map((d) => d.service_location_id as number)));

    // 2. Load vendor's own pricing rows for these locations
    const vendorPricings = await this.prisma.vendor_pricing.findMany({
      where: { vendor_id: vendorId, location_id: { in: locationIds } },
      orderBy: { sub_service_id: 'asc' },
    });

    // 3. Load location ceilings for these locations
    const locationPricings = locationIds.length > 0
      ? await this.prisma.location_pricing.findMany({
          where: { location_id: { in: locationIds } },
        })
      : [];

    // Build a lookup map of vendor's configured prices: `${location_id}_${sub_service_id}` → vendorPricing
    const vendorPricingMap = new Map(
      vendorPricings.map((vp) => [`${vp.location_id}_${vp.sub_service_id}`, vp]),
    );

    // Merge: Return a list of all pricing configs for every location/sub-service combo
    // available to the vendor's drivers, showing what they have configured vs the ceiling.
    const result: VendorPricingWithCeilingDto[] = [];
    
    for (const ceiling of locationPricings) {
      const key = `${ceiling.location_id}_${ceiling.sub_service_id}`;
      const vp = vendorPricingMap.get(key);
      
      result.push({
        id: vp?.id ?? null,
        location_id: ceiling.location_id,
        sub_service_id: ceiling.sub_service_id,
        base_price: vp?.base_price ?? null,     // null indicates falling back to ceiling
        extra_distance_price: vp?.extra_distance_price ?? null, // null indicates falling back to ceiling
        updated_at: vp?.updated_at ?? null,
        ceiling_base_price: ceiling.base_price,
        ceiling_extra_distance_price: ceiling.extra_distance_price,
      });
    }

    return result;
  }

  /**
   * Vendor updates their pricing for a specific sub-service.
   * Enforces that the new price does NOT exceed the location's configured ceiling.
   *
   * @param subServiceId - The sub-service to update pricing for
   * @param dto - New pricing values
   */
  async updateMyPricingAsync(
    subServiceId: number,
    dto: UpdateVendorPricingDto,
  ): Promise<VendorPricingDto> {
    const vendorId = this.callerService.getUserId();

    // Validate that the sub-service actually exists to prevent Prisma FK errors
    const subService = await this.prisma.sub_service.findUnique({
      where: { id: subServiceId },
    });
    
    if (!subService) {
      throw new BadRequestException(`Sub-service with ID ${subServiceId} does not exist`);
    }

    // Check if the vendor actually has a driver operating in this location
    const hasDriverInLocation = await this.prisma.driver.findFirst({
      where: { vendor_id: vendorId, service_location_id: dto.location_id, is_deleted: false },
    });

    if (!hasDriverInLocation) {
      throw new BadRequestException('You cannot update pricing for a location where you have no active drivers');
    }

    // Enforce ceiling: validate against the location's configured ceiling
    const ceiling = await this.prisma.location_pricing.findUnique({
      where: {
        location_id_sub_service_id: {
          location_id: dto.location_id,
          sub_service_id: subServiceId,
        },
      },
    });

    if (ceiling) {
      // Vendor cannot charge MORE than the location's configured maximum
      if (dto.base_price > ceiling.base_price) {
        throw new BadRequestException(
          `base_price ₹${dto.base_price} exceeds the maximum allowed ₹${ceiling.base_price} for this area`,
        );
      }
      if (dto.extra_distance_price > ceiling.extra_distance_price) {
        throw new BadRequestException(
          `extra_distance_price ₹${dto.extra_distance_price} exceeds the maximum allowed ₹${ceiling.extra_distance_price} for this area`,
        );
      }
    }

    // Upsert — creates the row if the vendor has no pricing for this location + sub-service
    const updated = await this.prisma.vendor_pricing.upsert({
      where: {
        vendor_id_location_id_sub_service_id: {
          vendor_id: vendorId,
          location_id: dto.location_id,
          sub_service_id: subServiceId,
        },
      },
      create: {
        vendor_id: vendorId,
        location_id: dto.location_id,
        sub_service_id: subServiceId,
        base_price: dto.base_price,
        extra_distance_price: dto.extra_distance_price,
      },
      update: {
        // ONLY update prices
        base_price: dto.base_price,
        extra_distance_price: dto.extra_distance_price,
      },
    });

    return {
      id: updated.id,
      location_id: updated.location_id,
      sub_service_id: updated.sub_service_id,
      base_price: updated.base_price,
      extra_distance_price: updated.extra_distance_price,
      updated_at: updated.updated_at,
    };
  }

  /**
   * Returns all pricing rows for a specific vendor (admin view — no auth restriction).
   */
  async getPricingForVendorAsync(vendorId: number): Promise<VendorPricingDto[]> {
    const pricings = await this.prisma.vendor_pricing.findMany({
      where: { vendor_id: vendorId },
      orderBy: { sub_service_id: 'asc' },
    });
    return pricings.map((vp) => ({
      id: vp.id,
      location_id: vp.location_id,
      sub_service_id: vp.sub_service_id,
      base_price: vp.base_price,
      extra_distance_price: vp.extra_distance_price,
      updated_at: vp.updated_at,
    }));
  }
}
