import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateVehicleClassConfigDto } from './dto/create-config.dto';
import { UpdateVehicleClassConfigDto } from './dto/update-config.dto';
@Injectable()
export class VehicleClassMappingService {
  constructor(private readonly _prisma: PrismaService) {}



  async getConfigBySubClassAsync(subClass: string) {
    if (!subClass) {
      throw new BadRequestException('subClass is required');
    }

    const config = await this._prisma.vehicle_class_configuration.findFirst({
      where: {
        sub_classes: {
          hasSome: [subClass, subClass.toUpperCase(), subClass.toLowerCase()],
        },
      },
      include: { accessories: true },
    });

    if (config) {
      return config;
    }

    // Default hardcoded fallbacks
    const lower = subClass.toLowerCase();
    let mappedClass = subClass;
    if (['lmv', 'suv', 'car', 'sedan', 'hatchback', 'jeep'].includes(lower)) mappedClass = 'Car';
    else if (['bike', 'motorcycle', 'scooter', 'two wheeler'].includes(lower)) mappedClass = 'Bike';
    else if (['riksaw', 'auto', 'three wheeler', 'auto riksaw'].includes(lower)) mappedClass = 'Riksaw';

    const fallbackConfig = await this._prisma.vehicle_class_configuration.findUnique({
      where: { mapped_class: mappedClass },
      include: { accessories: true },
    });

    if (!fallbackConfig) {
      return {
        mapped_class: mappedClass,
        diagram_image_url: '',
        total_damage_points: 0,
        accessories: [],
        sub_classes: [],
      };
    }

    return fallbackConfig;
  }

  async resolveMappedClass(sourceClass?: string | null): Promise<string> {
    if (!sourceClass) {
      return 'Car'; // default fallback
    }

    // Attempt match in sub_classes array
    const config = await this._prisma.vehicle_class_configuration.findFirst({
      where: {
        sub_classes: {
          hasSome: [sourceClass, sourceClass.toUpperCase(), sourceClass.toLowerCase()],
        },
      },
    });

    if (config) {
      return config.mapped_class;
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

  async createOrUpdateConfigAsync(dto: CreateVehicleClassConfigDto, diagramImageUrl?: string) {
    const existing = await this._prisma.vehicle_class_configuration.findUnique({
      where: { mapped_class: dto.mapped_class },
    });

    if (existing) {
      await this._prisma.vehicle_class_configuration.update({
        where: { mapped_class: dto.mapped_class },
        data: {
          sub_classes: dto.sub_classes,
          diagram_image_url: diagramImageUrl ?? existing.diagram_image_url,
          total_damage_points: dto.total_damage_points,
        },
      });

      if (dto.accessories) {
        await this._prisma.vehicle_class_accessory.deleteMany({
          where: { vehicle_class_configuration_id: existing.id },
        });
        if (dto.accessories.length > 0) {
          await this._prisma.vehicle_class_accessory.createMany({
            data: dto.accessories.map((a) => ({
              vehicle_class_configuration_id: existing.id,
              name: a,
            })),
          });
        }
      }

      return await this.getConfigByIdAsync(existing.id);
    }

    if (!diagramImageUrl) {
      throw new BadRequestException('A diagram image file is required for new configurations');
    }

    const created = await this._prisma.vehicle_class_configuration.create({
      data: {
        mapped_class: dto.mapped_class,
        sub_classes: dto.sub_classes,
        diagram_image_url: diagramImageUrl,
        total_damage_points: dto.total_damage_points,
      },
    });

    if (dto.accessories && dto.accessories.length > 0) {
      await this._prisma.vehicle_class_accessory.createMany({
        data: dto.accessories.map((a) => ({
          vehicle_class_configuration_id: created.id,
          name: a,
        })),
      });
    }

    return await this.getConfigByIdAsync(created.id);
  }

  async getConfigsAsync() {
    return await this._prisma.vehicle_class_configuration.findMany({
      orderBy: { mapped_class: 'asc' },
      include: { accessories: true },
    });
  }

  async getConfigByIdAsync(id: number) {
    const config = await this._prisma.vehicle_class_configuration.findUnique({
      where: { id },
      include: { accessories: true },
    });
    if (!config) {
      throw new BadRequestException('Configuration not found');
    }
    return config;
  }

  async updateConfigByIdAsync(id: number, dto: UpdateVehicleClassConfigDto, diagramImageUrl?: string) {
    const existing = await this.getConfigByIdAsync(id);

    if (dto.mapped_class && dto.mapped_class !== existing.mapped_class) {
      const classExists = await this._prisma.vehicle_class_configuration.findUnique({
        where: { mapped_class: dto.mapped_class },
      });
      if (classExists) {
        throw new BadRequestException('Mapped class already exists');
      }
    }

    await this._prisma.vehicle_class_configuration.update({
      where: { id },
      data: {
        mapped_class: dto.mapped_class ?? existing.mapped_class,
        sub_classes: dto.sub_classes ?? existing.sub_classes,
        diagram_image_url: diagramImageUrl ?? existing.diagram_image_url,
        total_damage_points: dto.total_damage_points ?? existing.total_damage_points,
      },
    });

    if (dto.accessories) {
      await this._prisma.vehicle_class_accessory.deleteMany({
        where: { vehicle_class_configuration_id: id },
      });
      if (dto.accessories.length > 0) {
        await this._prisma.vehicle_class_accessory.createMany({
          data: dto.accessories.map((a) => ({
            vehicle_class_configuration_id: id,
            name: a,
          })),
        });
      }
    }

    return await this.getConfigByIdAsync(id);
  }

  async deleteConfigByIdAsync(id: number) {
    await this.getConfigByIdAsync(id);
    
    // Explicitly delete related accessories first to avoid foreign key constraint errors
    await this._prisma.vehicle_class_accessory.deleteMany({
      where: { vehicle_class_configuration_id: id }
    });

    return await this._prisma.vehicle_class_configuration.delete({
      where: { id },
    });
  }
}
