import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateSubServiceDto } from './dto/create-sub-service.dto';
import { UpdateSubServiceDto } from './dto/update-sub-service.dto';
import { ServiceDto, SubServiceDto } from '../vendor/dto/service.dto';
import { ServiceListDto } from './dto/service-list.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly _prisma: PrismaService) { }

  // #region Service CRUD

  /**
   * Fetches all active services (simplified list).
   */
  async findAllAsync(): Promise<ServiceListDto[]> {
    const services = await this._prisma.service.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });

    return services;
  }

  /**
   * Fetches a single service by ID.
   */
  async findOneAsync(id: number): Promise<ServiceDto> {
    const service = await this._prisma.service.findUnique({
      where: { id },
      include: { sub_services: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service as unknown as ServiceDto;
  }

  /**
   * Creates a new service.
   */
  async createServiceAsync(dto: CreateServiceDto): Promise<ServiceDto> {
    const existing = await this._prisma.service.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(`Service with name "${dto.name}" already exists`);
    }

    const service = await this._prisma.service.create({
      data: dto,
    });

    return service as unknown as ServiceDto;
  }

  /**
   * Updates an existing service.
   */
  async updateServiceAsync(id: number, dto: UpdateServiceDto): Promise<ServiceDto> {
    await this.findOneAsync(id);

    if (dto.name) {
      const existing = await this._prisma.service.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new BadRequestException(`Service with name "${dto.name}" already exists`);
      }
    }

    const updated = await this._prisma.service.update({
      where: { id },
      data: dto,
    });

    return updated as unknown as ServiceDto;
  }

  /**
   * Deletes a service. Note: This will fail if there are dependent sub-services or orders.
   */
  async deleteServiceAsync(id: number): Promise<void> {
    await this.findOneAsync(id);

    try {
      await this._prisma.service.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException('Cannot delete service. It may have dependent sub-services or orders.');
    }
  }

  // #endregion

  // #region Sub-Service CRUD

  /**
   * Creates a new sub-service for a given service.
   */
  async createSubServiceAsync(dto: CreateSubServiceDto): Promise<SubServiceDto> {
    // Ensure parent service exists
    await this.findOneAsync(dto.service_id);

    const existing = await this._prisma.sub_service.findFirst({
      where: { name: dto.name, service_id: dto.service_id },
    });

    if (existing) {
      throw new BadRequestException(`Sub-service "${dto.name}" already exists for this service`);
    }

    const subService = await this._prisma.sub_service.create({
      data: dto,
    });

    return subService as unknown as SubServiceDto;
  }

  /**
   * Updates an existing sub-service.
   */
  async updateSubServiceAsync(id: number, dto: UpdateSubServiceDto): Promise<SubServiceDto> {
    const existingSub = await this._prisma.sub_service.findUnique({
      where: { id },
    });

    if (!existingSub) {
      throw new NotFoundException(`Sub-service with ID ${id} not found`);
    }

    if (dto.name || dto.service_id) {
      const name = dto.name ?? existingSub.name;
      const serviceId = dto.service_id ?? existingSub.service_id;

      const duplicate = await this._prisma.sub_service.findFirst({
        where: { name, service_id: serviceId, id: { not: id } },
      });

      if (duplicate) {
        throw new BadRequestException(`Sub-service "${name}" already exists for service ID ${serviceId}`);
      }
    }

    const updated = await this._prisma.sub_service.update({
      where: { id },
      data: dto,
    });

    return updated as unknown as SubServiceDto;
  }

  /**
   * Deletes a sub-service.
   */
  async deleteSubServiceAsync(id: number): Promise<void> {
    try {
      const existing = await this._prisma.sub_service.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException(`Sub-service with ID ${id} not found`);
      }

      await this._prisma.sub_service.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException('Cannot delete sub-service. It may have dependent orders.');
    }
  }

  /**
   * Fetches all active sub-services for a specific service.
   */
  async findSubServicesByServiceIdAsync(serviceId: number): Promise<SubServiceDto[]> {
    await this.findOneAsync(serviceId); // Verify service exists

    const subServices = await this._prisma.sub_service.findMany({
      where: { service_id: serviceId, is_active: true },
      orderBy: { name: 'asc' },
    });

    return subServices as unknown as SubServiceDto[];
  }

  // #endregion
}
