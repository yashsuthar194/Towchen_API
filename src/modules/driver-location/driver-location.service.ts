import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateDriverLocationDto } from './dto/create-driver-location.dto';
import { UpdateDriverLocationDto } from './dto/update-driver-location.dto';

@Injectable()
export class DriverLocationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDriverLocationDto: CreateDriverLocationDto) {
    return this.prisma.driver_location.create({
      data: createDriverLocationDto,
    });
  }

  async findAll() {
    return this.prisma.driver_location.findMany();
  }

  async findOne(id: number) {
    return this.prisma.driver_location.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateDriverLocationDto: UpdateDriverLocationDto) {
    return this.prisma.driver_location.update({
      where: { id },
      data: updateDriverLocationDto,
    });
  }

  async remove(id: number) {
    return this.prisma.driver_location.delete({
      where: { id },
    });
  }
}
