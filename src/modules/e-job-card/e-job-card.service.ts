import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { VehicleClassMappingService } from '../vehicle-class-mapping/vehicle-class-mapping.service';
import { SubmitPickupJobCardDto } from './dto/submit-pickup-job-card.dto';
import { JobCardType } from '@prisma/client';

@Injectable()
export class EJobCardService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _mappingService: VehicleClassMappingService,
  ) {}

  async submitPickupJobCardAsync(orderId: number, driverId: number, dto: SubmitPickupJobCardDto) {
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      include: { customer_vehicle: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this order');
    }

    if (!order.is_e_job_card_for_pickup) {
      throw new BadRequestException('E-Job Card is not enabled for pickup on this order');
    }

    // Resolve vehicle class mapping
    const rawClass = order.customer_vehicle?.class;
    const resolvedClass = await this._mappingService.resolveMappedClass(rawClass);

    return await this._prisma.$transaction(async (tx) => {
      // Delete existing pickup job card if any (idempotent submission)
      const existing = await tx.e_job_card.findUnique({
        where: {
          order_id_type: {
            order_id: orderId,
            type: JobCardType.pickup,
          },
        },
      });

      if (existing) {
        await tx.e_job_card.delete({
          where: { id: existing.id },
        });
      }

      // Create new E-Job Card
      const jobCard = await tx.e_job_card.create({
        data: {
          order_id: orderId,
          type: JobCardType.pickup,
          fuel_amount: dto.fuel_amount,
          odometer_reading_text: dto.odometer_reading_text,
          odometer_image: dto.odometer_image,
          vehicle_class: resolvedClass,
          driver_image: dto.driver_image,
          driver_sign: dto.driver_sign,
          remarks: dto.remarks,
          vehicle_images: dto.vehicle_images || [],
        },
      });

      // Create damages if any
      if (dto.damages && dto.damages.length > 0) {
        await tx.e_job_card_damage.createMany({
          data: dto.damages.map((dmg) => ({
            e_job_card_id: jobCard.id,
            damage_number: dmg.damage_number,
            image_url: dmg.image_url,
          })),
        });
      }

      return await tx.e_job_card.findUnique({
        where: { id: jobCard.id },
        include: { damages: true },
      });
    });
  }

  async getPickupJobCardAsync(orderId: number) {
    const jobCard = await this._prisma.e_job_card.findUnique({
      where: {
        order_id_type: {
          order_id: orderId,
          type: JobCardType.pickup,
        },
      },
      include: { damages: true },
    });

    if (!jobCard) {
      throw new NotFoundException(`Pickup E-Job Card for Order ${orderId} not found`);
    }

    return jobCard;
  }

  async getJobCardConfigurationAsync(orderId: number) {
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      include: { customer_vehicle: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const rawClass = order.customer_vehicle?.class;
    const resolvedClass = await this._mappingService.resolveMappedClass(rawClass);

    const config = await this._prisma.vehicle_class_configuration.findUnique({
      where: { mapped_class: resolvedClass },
    });

    if (!config) {
      return {
        mapped_class: resolvedClass,
        diagram_image_url: '',
        total_damage_points: 0,
      };
    }

    return config;
  }
}
