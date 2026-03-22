import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateDriverLocationDto } from './dto/create-driver-location.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { LocationCategory } from '@prisma/client';

/**
 * Service responsible for managing location records.
 * Handles database operations for tracking geographical positions.
 */
@Injectable()
export class DriverLocationService {
  constructor(private readonly prisma: PrismaService) {}

  //#region Add
  /**
   * Creates a new location record in the database.
   * 
   * @param dto - Data for the new location
   * @returns The created location record
   */
  async createAsync(dto: CreateDriverLocationDto) {
    return this.prisma.location.create({
      data: dto as any,
    });
  }
  //#endregion

  //#region Get
  /**
   * Retrieves all location records from the database.
   * 
   * @returns An array of all location records
   */
  async findAllAsync() {
    return this.prisma.location.findMany();
  }

  /**
   * Retrieves all driver location records from the database.
   * 
   * @returns An array of all driver location records
   */
  async findAllDriverLocationsAsync() {
    return this.prisma.location.findMany({
      where: {
        category: LocationCategory.Driver,
      },
    });
  }

  /**
   * Retrieves a single location record by its unique ID.
   * 
   * @param id - The numeric ID of the location record
   * @returns The requested location record or null if not found
   */
  async findOneAsync(id: number) {
    return this.prisma.location.findUnique({
      where: { id },
    });
  }
  //#endregion

  //#region Update
  /**
   * Updates an existing location record.
   * 
   * @param id - The numeric ID of the location record to update
   * @param dto - The updated data
   * @returns The updated location record
   */
  async updateAsync(id: number, dto: UpdateDriverLocationDto) {
    return this.prisma.location.update({
      where: { id },
      data: dto as any,
    });
  }
  //#endregion

  //#region Delete
  /**
   * Deletes a location record from the database.
   * 
   * @param id - The numeric ID of the location record to delete
   * @returns The result of the deletion operation
   */
  async deleteAsync(id: number) {
    return this.prisma.location.delete({
      where: { id },
    });
  }
  //#endregion
}

