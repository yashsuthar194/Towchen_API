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

@ApiTags('driver-location')
@Controller('driver-location')
export class DriverLocationController {
  constructor(private readonly driverLocationService: DriverLocationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new driver location' })
  create(@Body() createDriverLocationDto: CreateDriverLocationDto) {
    return this.driverLocationService.create(createDriverLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all driver locations' })
  findAll() {
    return this.driverLocationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific driver location by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.driverLocationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a driver location' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDriverLocationDto: UpdateDriverLocationDto,
  ) {
    return this.driverLocationService.update(id, updateDriverLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a driver location' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.driverLocationService.remove(id);
  }
}
