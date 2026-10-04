import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateDealerPackagePlanDto } from './dto/create-dealer-package-plan.dto';
import { UpdateDealerPackagePlanDto } from './dto/update-dealer-package-plan.dto';
import { CarSegment } from '@prisma/client';

@Injectable()
export class DealerPackagePlanService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to resolve the plan price based on a given car segment
   */
  resolveSegmentPrice(
    plan: {
      price_basic: number;
      price_standard: number;
      price_premium: number;
    },
    segment: CarSegment,
  ): number {
    switch (segment) {
      case CarSegment.Basic:
        return plan.price_basic;
      case CarSegment.Standard:
        return plan.price_standard;
      case CarSegment.Premium:
        return plan.price_premium;
      default:
        return plan.price_basic;
    }
  }

  /**
   * Creates a new package plan (Admin)
   */
  async createPlanAsync(dto: CreateDealerPackagePlanDto) {
    return this.prisma.dealer_package_plan.create({
      data: {
        name: dto.name,
        plan_period_months: dto.plan_period_months,
        incidents: dto.incidents,
        distance_km: dto.distance_km,
        hotel_accommodation: dto.hotel_accommodation ?? 0,
        cab_service: dto.cab_service ?? 0,
        price_basic: dto.price_basic,
        price_standard: dto.price_standard,
        price_premium: dto.price_premium,
        is_active: dto.is_active ?? true,
      },
    });
  }

  /**
   * Retrieves all active plans (Optionally resolves specific price for segment)
   */
  async findAllActiveAsync(segment?: CarSegment) {
    const plans = await this.prisma.dealer_package_plan.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });

    if (segment) {
      return plans.map((plan) => ({
        ...plan,
        selected_segment: segment,
        resolved_price: this.resolveSegmentPrice(plan, segment),
      }));
    }

    return plans;
  }

  /**
   * Retrieves all package plans for administration
   */
  async findAllAsync() {
    return this.prisma.dealer_package_plan.findMany({
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Retrieves a single package plan by ID
   */
  async findOneAsync(id: number) {
    const plan = await this.prisma.dealer_package_plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Dealer package plan with ID ${id} not found.`);
    }

    return plan;
  }

  /**
   * Updates an existing package plan
   */
  async updatePlanAsync(id: number, dto: UpdateDealerPackagePlanDto) {
    await this.findOneAsync(id);

    return this.prisma.dealer_package_plan.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  /**
   * Deactivates or removes a package plan
   */
  async deletePlanAsync(id: number) {
    await this.findOneAsync(id);

    return this.prisma.dealer_package_plan.update({
      where: { id },
      data: { is_active: false },
    });
  }
}
