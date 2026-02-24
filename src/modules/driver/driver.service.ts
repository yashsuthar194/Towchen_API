import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriverService {
    constructor(private readonly prisma: PrismaService) { }

    private async validateUniqueness(email?: string, number?: string, excludeDriverId?: number) {
        const promises: Promise<void>[] = [];

        if (email) {
            promises.push(
                this.prisma.vendor.findUnique({ where: { email }, select: { id: true } }).then(vendor => {
                    if (vendor) throw new BadRequestException('Email is already registered as a vendor.');
                }),
                this.prisma.driver.findUnique({ where: { email }, select: { id: true } }).then(driver => {
                    if (driver && driver.id !== excludeDriverId) throw new BadRequestException('Email is already registered as a driver.');
                })
            );
        }

        if (number) {
            promises.push(
                this.prisma.vendor.findUnique({ where: { number }, select: { id: true } }).then(vendor => {
                    if (vendor) throw new BadRequestException('Number is already registered as a vendor.');
                }),
                this.prisma.driver.findUnique({ where: { number }, select: { id: true } }).then(driver => {
                    if (driver && driver.id !== excludeDriverId) throw new BadRequestException('Number is already registered as a driver.');
                })
            );
        }

        if (promises.length > 0) {
            await Promise.all(promises);
        }
    }

    async create(createDriverDto: CreateDriverDto) {
        await this.validateUniqueness(createDriverDto.email, createDriverDto.number);
        return this.prisma.driver.create({
            data: createDriverDto,
        });
    }

    async findAll() {
        return this.prisma.driver.findMany();
    }

    async findOne(id: number) {
        const driver = await this.prisma.driver.findUnique({
            where: { id },
        });
        if (!driver) {
            throw new NotFoundException(`Driver with ID ${id} not found`);
        }
        return driver;
    }

    async update(id: number, updateDriverDto: UpdateDriverDto) {
        // Check if exists
        await this.findOne(id);

        await this.validateUniqueness(updateDriverDto.email, updateDriverDto.number, id);
        return this.prisma.driver.update({
            where: { id },
            data: updateDriverDto,
        });
    }

    async remove(id: number) {
        // Check if exists
        await this.findOne(id);
        return this.prisma.driver.delete({
            where: { id },
        });
    }
}
