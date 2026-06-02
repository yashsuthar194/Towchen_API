import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateDriverLocationDto } from './dto/create-driver-location.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { LocationCategory } from '@prisma/client';
import { Utility } from 'src/shared/helper/utility';

import { LocationService } from '../location/location.service';

/**
 * Service responsible for managing location records.
 * Handles database operations for tracking geographical positions.
 */
@Injectable()
export class DriverLocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationService: LocationService,
  ) { }

  //#region Add
  /**
   * Creates a new location record in the database.
   * If a place_id is provided, it resolves the full address details via Google Maps.
   * 
   * @param dto - Data for the new location
   * @returns The created location record
   */
  async createAsync(dto: CreateDriverLocationDto) {
    let data: any = { ...dto };

    // If place_id is provided, resolve full details
    if (dto.place_id) {
      const resolved = await this.locationService.resolveAddressAsync({ place_id: dto.place_id });
      data = {
        ...data,
        address: resolved.address,
        street: resolved.street,
        area: resolved.area,
        city: resolved.city,
        state: resolved.state,
        pincode: resolved.pincode,
        country: resolved.country,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        landmark: resolved.landmark,
      };
    }

    const location = await this.prisma.location.create({
      data: data,
    });
    return { ...location, address: Utility.formatAddress(location) };
  }
  //#endregion

  //#region Get
  /**
   * Retrieves all location records from the database.
   * 
   * @returns An array of all location records
   */
  async findAllAsync() {
    const locations = await this.prisma.location.findMany();
    return locations.map((loc) => ({
      ...loc,
      address: Utility.formatAddress(loc),
    }));
  }

  /**
   * Retrieves all driver location records from the database.
   * 
   * @returns An array of all driver location records
   */
  async findAllDriverLocationsAsync() {
    const locations = await this.prisma.location.findMany({
      where: {
        category: LocationCategory.Driver,
      },
    });
    return locations.map((loc) => ({
      ...loc,
      address: Utility.formatAddress(loc),
    }));
  }

  /**
   * Retrieves a single location record by its unique ID.
   * 
   * @param id - The numeric ID of the location record
   * @returns The requested location record or null if not found
   */
  async findOneAsync(id: number) {
    const location = await this.prisma.location.findUnique({
      where: { id },
    });
    if (!location) return null;
    return { ...location, address: Utility.formatAddress(location) };
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
    let data: any = { ...dto };

    // If a new place_id is provided, re-resolve all details
    if (dto.place_id) {
      const resolved = await this.locationService.resolveAddressAsync({ place_id: dto.place_id });
      data = {
        ...data,
        address: resolved.address,
        street: resolved.street,
        area: resolved.area,
        city: resolved.city,
        state: resolved.state,
        pincode: resolved.pincode,
        country: resolved.country,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        landmark: resolved.landmark,
      };
    }

    const location = await this.prisma.location.update({
      where: { id },
      data: data,
    });
    return { ...location, address: Utility.formatAddress(location) };
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

