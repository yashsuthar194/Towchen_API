import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateVehicleClassMappingDto } from './dto/create-mapping.dto';
import { CreateVehicleClassConfigDto } from './dto/create-config.dto';

@Injectable()
export class VehicleClassMappingService {
  constructor(private readonly _prisma: PrismaService) {}

  async createMappingAsync(dto: CreateVehicleClassMappingDto) {
    const existing = await this._prisma.vehicle_class_mapping.findUnique({
      where: { source_class: dto.source_class },
    });

    if (existing) {
      return await this._prisma.vehicle_class_mapping.update({
        where: { source_class: dto.source_class },
        data: { mapped_class: dto.mapped_class },
      });
    }

    return await this._prisma.vehicle_class_mapping.create({
      data: {
        source_class: dto.source_class,
        mapped_class: dto.mapped_class,
      },
    });
  }

  async getMappingsAsync() {
    return await this._prisma.vehicle_class_mapping.findMany({
      orderBy: { source_class: 'asc' },
    });
  }

  async resolveMappedClass(sourceClass?: string | null): Promise<string> {
    if (!sourceClass) {
      return 'Car'; // default fallback
    }

    // Attempt case-insensitive match or direct match
    const mapping = await this._prisma.vehicle_class_mapping.findFirst({
      where: {
        source_class: {
          equals: sourceClass,
          mode: 'insensitive',
        },
      },
    });

    if (mapping) {
      return mapping.mapped_class;
    }

    // Default hardcoded fallbacks if no mapping is found in DB
    const lower = sourceClass.toLowerCase();
    if (['lmv', 'suv', 'car', 'sedan', 'hatchback', 'jeep'].includes(lower)) {
      return 'Car';
    }
    if (['bike', 'motorcycle', 'scooter', 'two wheeler'].includes(lower)) {
      return 'Bike';
    }
    if (['riksaw', 'auto', 'three wheeler', 'auto riksaw'].includes(lower)) {
      return 'Riksaw';
    }

    return sourceClass; // return as-is if no match
  }

  async createOrUpdateConfigAsync(dto: CreateVehicleClassConfigDto) {
    const existing = await this._prisma.vehicle_class_configuration.findUnique({
      where: { mapped_class: dto.mapped_class },
    });

    if (existing) {
      return await this._prisma.vehicle_class_configuration.update({
        where: { mapped_class: dto.mapped_class },
        data: {
          diagram_image_url: dto.diagram_image_url,
          total_damage_points: dto.total_damage_points,
        },
      });
    }

    return await this._prisma.vehicle_class_configuration.create({
      data: {
        mapped_class: dto.mapped_class,
        diagram_image_url: dto.diagram_image_url,
        total_damage_points: dto.total_damage_points,
      },
    });
  }

  async getConfigsAsync() {
    return await this._prisma.vehicle_class_configuration.findMany({
      orderBy: { mapped_class: 'asc' },
    });
  }
}
