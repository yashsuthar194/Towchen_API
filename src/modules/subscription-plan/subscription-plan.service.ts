import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlanAsync(dto: CreateSubscriptionPlanDto) {
    return this.prisma.subscription_plan.create({
      data: {
        name: dto.name,
        pricing: dto.pricing,
        plan_period_months: dto.plan_period_months,
        incidents: dto.incidents,
        distance_km: dto.distance_km,
        vehicle_type: dto.vehicle_type,
      },
    });
  }

  async findAllActiveAsync() {
    return this.prisma.subscription_plan.findMany({
      where: { is_active: true },
    });
  }

  async findAllAsync() {
    return this.prisma.subscription_plan.findMany();
  }

  async findOneAsync(id: number) {
    const plan = await this.prisma.subscription_plan.findUnique({
      where: { id },
    });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    return plan;
  }

  async updatePlanAsync(id: number, dto: UpdateSubscriptionPlanDto) {
    await this.findOneAsync(id); // Ensure it exists
    return this.prisma.subscription_plan.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async deletePlanAsync(id: number) {
    await this.findOneAsync(id); // Ensure it exists
    return this.prisma.subscription_plan.delete({
      where: { id },
    });
  }
}
