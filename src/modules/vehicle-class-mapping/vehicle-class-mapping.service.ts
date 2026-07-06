import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateVehicleClassConfigDto, ConditionGroupInputDto } from './dto/create-config.dto';
import { UpdateVehicleClassConfigDto } from './dto/update-config.dto';
import { CreateAccessoryDto } from './dto/create-accessory.dto';
import { CreateConditionGroupDto, UpdateConditionGroupDto } from './dto/condition-group.dto';
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
      include: { 
        accessories: true,
        vehicle_states: { include: { options: true } }
      },
    });

    if (config) {
      const { vehicle_states, ...rest } = config;
      return { ...rest, vehicle_state: vehicle_states };
    }

    // Default hardcoded fallbacks
    const lower = subClass.toLowerCase();
    let mappedClass = subClass;
    if (['lmv', 'suv', 'car', 'sedan', 'hatchback', 'jeep'].includes(lower)) mappedClass = 'Car';
    else if (['bike', 'motorcycle', 'scooter', 'two wheeler'].includes(lower)) mappedClass = 'Bike';
    else if (['riksaw', 'auto', 'three wheeler', 'auto riksaw'].includes(lower)) mappedClass = 'Riksaw';

    const fallbackConfig = await this._prisma.vehicle_class_configuration.findUnique({
      where: { mapped_class: mappedClass },
      include: { 
        accessories: true,
        vehicle_states: { include: { options: true } }
      },
    });

    if (!fallbackConfig) {
      return {
        mapped_class: mappedClass,
        diagram_image_url: '',
        total_damage_points: 0,
        accessories: [],
        sub_classes: [],
        vehicle_state: [],
      };
    }

    const { vehicle_states, ...rest } = fallbackConfig;
    return { ...rest, vehicle_state: vehicle_states };
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

  private async _updateConditionGroupsAsync(configId: number, conditionGroups: ConditionGroupInputDto[]) {
    const existingGroups = await this._prisma.vehicle_state.findMany({
      where: { vehicle_class_configuration_id: configId }
    });
    
    const existingGroupIds = existingGroups.map(g => g.id);

    if (existingGroupIds.length > 0) {
      await this._prisma.vehicle_state_option.deleteMany({
        where: { vehicle_state_id: { in: existingGroupIds } }
      });
    }

    await this._prisma.vehicle_state.deleteMany({
      where: { vehicle_class_configuration_id: configId }
    });

    await Promise.all(
      conditionGroups.map((groupDto) =>
        this._prisma.vehicle_state.create({
          data: {
            vehicle_class_configuration_id: configId,
            name: groupDto.name,
            options: {
              create: groupDto.options?.map((opt) => ({ name: opt })) || [],
            },
          },
        })
      )
    );
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

      if (dto.vehicle_state) {
        await this._updateConditionGroupsAsync(existing.id, dto.vehicle_state);
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

    if (dto.vehicle_state) {
      await this._updateConditionGroupsAsync(created.id, dto.vehicle_state);
    }

    return await this.getConfigByIdAsync(created.id);
  }

  async getConfigsAsync() {
    const configs = await this._prisma.vehicle_class_configuration.findMany({
      orderBy: { mapped_class: 'asc' },
      include: { 
        accessories: true,
        vehicle_states: { include: { options: true } }
      },
    });
    
    return configs.map(config => {
      const { vehicle_states, ...rest } = config;
      return { ...rest, vehicle_state: vehicle_states };
    });
  }

  async getConfigByIdAsync(id: number) {
    const config = await this._prisma.vehicle_class_configuration.findUnique({
      where: { id },
      include: { 
        accessories: true,
        vehicle_states: { include: { options: true } }
      },
    });
    if (!config) {
      throw new BadRequestException('Configuration not found');
    }
    const { vehicle_states, ...rest } = config;
    return { ...rest, vehicle_state: vehicle_states };
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

    if (dto.vehicle_state) {
      await this._updateConditionGroupsAsync(id, dto.vehicle_state);
    }

    return await this.getConfigByIdAsync(id);
  }

  async deleteConfigByIdAsync(id: number) {
    await this.getConfigByIdAsync(id);
    
    // Explicitly delete related accessories first to avoid foreign key constraint errors
    await this._prisma.vehicle_class_accessory.deleteMany({
      where: { vehicle_class_configuration_id: id }
    });

    // Explicitly delete condition options and groups
    const existingGroups = await this._prisma.vehicle_state.findMany({
      where: { vehicle_class_configuration_id: id }
    });
    
    if (existingGroups.length > 0) {
      await this._prisma.vehicle_state_option.deleteMany({
        where: { vehicle_state_id: { in: existingGroups.map(g => g.id) } }
      });
    }

    await this._prisma.vehicle_state.deleteMany({
      where: { vehicle_class_configuration_id: id }
    });

    return await this._prisma.vehicle_class_configuration.delete({
      where: { id },
    });
  }

  async addAccessoryAsync(dto: CreateAccessoryDto) {
    const config = await this.getConfigByIdAsync(dto.vehicle_class_configuration_id);
    return await this._prisma.vehicle_class_accessory.create({
      data: {
        vehicle_class_configuration_id: config.id,
        name: dto.name,
      },
    });
  }

  async addConditionGroupAsync(dto: CreateConditionGroupDto) {
    await this.getConfigByIdAsync(dto.vehicle_class_configuration_id); // Verify config exists

    return await this._prisma.vehicle_state.create({
      data: {
        vehicle_class_configuration_id: dto.vehicle_class_configuration_id,
        name: dto.name,
        options: {
          create: dto.options.map(opt => ({ name: opt }))
        }
      },
      include: { options: true }
    });
  }

  async updateConditionGroupAsync(id: number, dto: UpdateConditionGroupDto) {
    const existing = await this._prisma.vehicle_state.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Condition group not found');

    if (dto.options) {
      // Replace options if provided
      await this._prisma.vehicle_state_option.deleteMany({
        where: { vehicle_state_id: id }
      });
      if (dto.options.length > 0) {
        await this._prisma.vehicle_state_option.createMany({
          data: dto.options.map(opt => ({ vehicle_state_id: id, name: opt }))
        });
      }
    }

    return await this._prisma.vehicle_state.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name })
      },
      include: { options: true }
    });
  }

  async deleteConditionGroupAsync(id: number) {
    const existing = await this._prisma.vehicle_state.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Condition group not found');

    await this._prisma.vehicle_state_option.deleteMany({
      where: { vehicle_state_id: id }
    });

    return await this._prisma.vehicle_state.delete({
      where: { id }
    });
  }
}
