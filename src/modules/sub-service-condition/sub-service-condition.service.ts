import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSubServiceConditionDto } from './dto/create-condition.dto';
import { UpdateSubServiceConditionDto } from './dto/update-condition.dto';
import { SubServiceConditionDto } from '../vendor/dto/service.dto';

@Injectable()
export class SubServiceConditionService {
  constructor(private readonly _prisma: PrismaService) {}

  /**
   * Fetches all conditions for a specific sub-service by its ID.
   */
  async findConditionsBySubServiceIdAsync(subServiceId: number): Promise<SubServiceConditionDto[]> {
    const subService = await this._prisma.sub_service.findUnique({
      where: { id: subServiceId },
    });

    if (!subService) {
      throw new NotFoundException(`Sub-service with ID ${subServiceId} not found`);
    }

    const conditions = await this._prisma.sub_service_condtion.findMany({
      where: { sub_service_id: subServiceId },
      orderBy: { id: 'asc' },
    });

    return conditions as unknown as SubServiceConditionDto[];
  }

  /**
   * Creates a new condition for a sub-service.
   */
  async createConditionAsync(dto: CreateSubServiceConditionDto): Promise<SubServiceConditionDto> {
    const subService = await this._prisma.sub_service.findUnique({
      where: { id: dto.sub_service_id },
    });

    if (!subService) {
      throw new NotFoundException(`Sub-service with ID ${dto.sub_service_id} not found`);
    }

    const condition = await this._prisma.sub_service_condtion.create({
      data: {
        sub_service_id: dto.sub_service_id,
        condition: dto.condition,
      },
    });

    return condition as unknown as SubServiceConditionDto;
  }

  /**
   * Updates an existing sub-service condition by ID.
   */
  async updateConditionAsync(id: number, dto: UpdateSubServiceConditionDto): Promise<SubServiceConditionDto> {
    const condition = await this._prisma.sub_service_condtion.findUnique({
      where: { id },
    });

    if (!condition) {
      throw new NotFoundException(`Sub-service condition with ID ${id} not found`);
    }

    const updated = await this._prisma.sub_service_condtion.update({
      where: { id },
      data: {
        condition: dto.condition,
      },
    });

    return updated as unknown as SubServiceConditionDto;
  }

  /**
   * Deletes a sub-service condition by ID.
   */
  async deleteConditionAsync(id: number): Promise<void> {
    const condition = await this._prisma.sub_service_condtion.findUnique({
      where: { id },
    });

    if (!condition) {
      throw new NotFoundException(`Sub-service condition with ID ${id} not found`);
    }

    await this._prisma.sub_service_condtion.delete({
      where: { id },
    });
  }
}
