import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateDriverLocationDto } from './dto/create-driver-location.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';

/**
 * Service responsible for managing driver location records.
 * Handles database operations for tracking geographical positions.
 */
@Injectable()
export class DriverLocationService {
  constructor(private readonly prisma: PrismaService) {}

  //#region Add
  /**
   * Creates a new driver location record in the database.
   * 
   * @param dto - Data for the new driver location
   * @returns The created driver location record
   */
  async createAsync(dto: CreateDriverLocationDto) {
    return this.prisma.driver_location.create({
      data: dto,
    });
  }
  //#endregion

  //#region Get
  /**
   * Retrieves all driver location records from the database.
   * 
   * @returns An array of all driver location records
   */
  async findAllAsync() {
    return this.prisma.driver_location.findMany();
  }

  /**
   * Retrieves a single driver location record by its unique ID.
   * 
   * @param id - The numeric ID of the location record
   * @returns The requested driver location record or null if not found
   */
  async findOneAsync(id: number) {
    return this.prisma.driver_location.findUnique({
      where: { id },
    });
  }
  //#endregion

  //#region Update
  /**
   * Updates an existing driver location record.
   * 
   * @param id - The numeric ID of the location record to update
   * @param dto - The updated data
   * @returns The updated driver location record
   */
  async updateAsync(id: number, dto: UpdateDriverLocationDto) {
    return this.prisma.driver_location.update({
      where: { id },
      data: dto,
    });
  }
  //#endregion

  //#region Delete
  /**
   * Deletes a driver location record from the database.
   * 
   * @param id - The numeric ID of the location record to delete
   * @returns The result of the deletion operation
   */
  async deleteAsync(id: number) {
    return this.prisma.driver_location.delete({
      where: { id },
    });
  }
  //#endregion
}

