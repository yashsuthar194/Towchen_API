import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { DriverLocationService } from './driver-location.service';
import { CreateDriverLocationDto } from './dto/create-driver-location.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Controller for managing driver locations.
 * Provides endpoints for creating, retrieving, updating, and deleting
 * the geographical coordinates and status of drivers.
 */
@ApiTags('driver-location')
@Controller('driver-location')
export class DriverLocationController {
  constructor(private readonly driverLocationService: DriverLocationService) {}

  /**
   * Creates a new driver location record.
   * This is used to initialize or log a driver's position in the system.
   * 
   * @param createDriverLocationDto - The data required to create a location entry
   * @returns The created driver location object
   */
  @Post()
  @ApiOperation({ summary: 'Create a new driver location' })
  async create(@Body() createDriverLocationDto: CreateDriverLocationDto) {
    return await this.driverLocationService.createAsync(createDriverLocationDto);
  }

  /**
   * Retrieves a list of all driver locations stored in the system.
   * Useful for administrative overview or mapping multiple drivers.
   * 
   * @returns An array of all driver location records
   */
  @Get()
  @ApiOperation({ summary: 'Get all driver locations' })
  async findAll() {
    return await this.driverLocationService.findAllDriverLocationsAsync();
  }

  /**
   * Retrieves the details of a specific driver location by its unique ID.
   * 
   * @param id - The numeric ID of the driver location record
   * @returns The requested driver location record
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific driver location by id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.driverLocationService.findOneAsync(id);
  }

  /**
   * Updates an existing driver location record.
   * Typically used to update the latitude/longitude or other status 
   * information for a specific record.
   * 
   * @param id - The numeric ID of the driver location record to update
   * @param updateDriverLocationDto - The updated data
   * @returns The updated driver location record
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update a driver location' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDriverLocationDto: UpdateDriverLocationDto,
  ) {
    return await this.driverLocationService.updateAsync(
      id,
      updateDriverLocationDto,
    );
  }

  /**
   * Deletes a driver location record from the system.
   * 
   * @param id - The numeric ID of the driver location record to remove
   * @returns The result of the deletion operation
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a driver location' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.driverLocationService.deleteAsync(id);
  }
}
