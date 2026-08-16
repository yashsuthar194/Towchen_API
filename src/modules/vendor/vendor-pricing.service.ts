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
   * Returns all pricing rows for the currently authenticated vendor.
   * Each row is enriched with the location's ceiling values so the frontend
   * can show the vendor how much room they have to increase or decrease.
   */
  async getMyPricingAsync(): Promise<VendorPricingWithCeilingDto[]> {
    const vendorId = this.callerService.getUserId();

    // Load vendor to get their linked location_id
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, location_id: true },
    });

    if (!vendor) throw new NotFoundException('Vendor not found');

    // Load vendor's own pricing rows
    const vendorPricings = await this.prisma.vendor_pricing.findMany({
      where: { vendor_id: vendorId },
      orderBy: { sub_service_id: 'asc' },
    });

    // Load location ceilings (if vendor has a location assigned)
    const locationPricings =
      vendor.location_id
        ? await this.prisma.location_pricing.findMany({
            where: { location_id: vendor.location_id },
          })
        : [];

    // Build a quick lookup map: sub_service_id → ceiling
    const ceilingMap = new Map(
      locationPricings.map((lp) => [lp.sub_service_id, lp]),
    );

    // Merge vendor pricing with ceiling info for the response
    return vendorPricings.map((vp) => {
      const ceiling = ceilingMap.get(vp.sub_service_id);
      return {
        id: vp.id,
        sub_service_id: vp.sub_service_id,
        fix_price: vp.fix_price,
        extra_price: vp.extra_price,
        updated_at: vp.updated_at,
        ceiling_fix_price: ceiling?.fix_price ?? null,
        ceiling_extra_price: ceiling?.extra_price ?? null,
      };
    });
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

    // Load vendor with location_id to look up ceiling
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, location_id: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    let ceiling;

    // Enforce ceiling: if the vendor's location has a configured ceiling, validate against it
    if (vendor.location_id) {
      ceiling = await this.prisma.location_pricing.findUnique({
        where: {
          location_id_sub_service_id: {
            location_id: vendor.location_id,
            sub_service_id: subServiceId,
          },
        },
      });

      if (ceiling) {
        // Vendor cannot charge MORE than the location's configured maximum
        if (dto.fix_price > ceiling.fix_price) {
          throw new BadRequestException(
            `fix_price ₹${dto.fix_price} exceeds the maximum allowed ₹${ceiling.fix_price} for your area`,
          );
        }
        if (dto.extra_price > ceiling.extra_price) {
          throw new BadRequestException(
            `extra_price ₹${dto.extra_price} exceeds the maximum allowed ₹${ceiling.extra_price} for your area`,
          );
        }
      }
    }

    // Upsert — creates the row if the vendor somehow has no pricing for this sub-service
    const updated = await this.prisma.vendor_pricing.upsert({
      where: {
        vendor_id_sub_service_id: {
          vendor_id: vendorId,
          sub_service_id: subServiceId,
        },
      },
      create: {
        vendor_id: vendorId,
        sub_service_id: subServiceId,
        fix_price: dto.fix_price,
        extra_price: dto.extra_price,
      },
      update: {
        // ONLY update prices
        fix_price: dto.fix_price,
        extra_price: dto.extra_price,
      },
    });

    return {
      id: updated.id,
      sub_service_id: updated.sub_service_id,
      fix_price: updated.fix_price,
      extra_price: updated.extra_price,
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
      sub_service_id: vp.sub_service_id,
      fix_price: vp.fix_price,
      extra_price: vp.extra_price,
      updated_at: vp.updated_at,
    }));
  }
}
