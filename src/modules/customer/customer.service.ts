import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { RegisterCustomerDto, RegisterCustomerVehicleDto } from './dto/register-customer.dto';
import { UpdateCustomerVehicleDto } from './dto/update-customer-vehicle.dto';
import { JwtService } from 'src/services/jwt/jwt.service';
import { Role } from '@prisma/client';

@Injectable()
export class CustomerService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly _jwtService: JwtService,
    ) { }

    /**
     * Registers a new customer and their vehicle
     * @param dto Data for registering the customer and their vehicle
     */
    async registerCustomerAsync(dto: RegisterCustomerDto) {
        // Check if the customer already exists by email or number
        const existingCustomer = await this.prisma.customer.findFirst({
            where: {
                OR: [{ email: dto.email }, { number: dto.number }],
            },
        });

        if (existingCustomer) {
            if (existingCustomer.email === dto.email) {
                throw new BadRequestException('A customer with this email already exists.');
            }
            throw new BadRequestException('A customer with this mobile number already exists.');
        }

        try {
            // Create the customer and their vehicle using a nested Prisma query
            const newCustomer = await this.prisma.customer.create({
                data: {
                    full_name: dto.full_name,
                    email: dto.email,
                    number: dto.number,
                    formated_id: '', // Handled by PostgreSQL BEFORE INSERT trigger
                    is_verified: true,
                    customer_vehicles: {
                        create: {
                            make: dto.vehicle.make,
                            model: dto.vehicle.model,
                            registration_number: dto.vehicle.registration_number,
                            class: dto.vehicle.class,
                            fuel_type: dto.vehicle.fuel_type,
                        },
                    },
                },
                include: {
                    customer_vehicles: true,
                },
            });

            // Generate tokens for the new customer
            const tokens = await this._jwtService.generateTokens({
                id: newCustomer.id,
                email: newCustomer.email,
                type: Role.Customer,
            });

            return {
                ...tokens,
            };
        } catch (error) {
            console.error('Error creating customer:', error);
            throw new InternalServerErrorException('Failed to register customer. Please try again later.');
        }
    }

    /**
     * Gets a customer by ID, ensuring they are not soft-deleted
     * @param id The customer ID
     */
    async getByIdAsync(id: number) {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id,
                is_deleted: false,
            },
            include: {
                customer_vehicles: {
                    where: { is_deleted: false }
                }
            }
        });

        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`);
        }

        return customer;
    }

    /**
     * Adds a new vehicle to an existing customer
     * @param customerId The customer ID
     * @param dto Data for the new vehicle
     */
    async addVehicleAsync(customerId: number, dto: RegisterCustomerVehicleDto) {
        // Ensure customer exists
        await this.getByIdAsync(customerId);

        try {
            const newVehicle = await this.prisma.customer_vehicle.create({
                data: {
                    customer_id: customerId,
                    make: dto.make,
                    model: dto.model,
                    registration_number: dto.registration_number,
                    class: dto.class,
                    fuel_type: dto.fuel_type,
                },
            });

            return newVehicle;
        } catch (error) {
            console.error('Error adding customer vehicle:', error);
            throw new InternalServerErrorException('Failed to add vehicle to customer.');
        }
    }

    /**
     * Retrieves all vehicles for a customer
     * @param customerId The customer ID
     */
    async getVehiclesAsync(customerId: number) {
        // Ensure customer exists
        await this.getByIdAsync(customerId);

        try {
            const vehicles = await this.prisma.customer_vehicle.findMany({
                where: {
                    customer_id: customerId,
                    is_deleted: false,
                },
                orderBy: { id: 'asc' },
            });

            return vehicles;
        } catch (error) {
            console.error('Error retrieving customer vehicles:', error);
            throw new InternalServerErrorException('Failed to retrieve vehicles.');
        }
    }

    /**
     * Soft deletes a customer and their vehicles
     * @param id The customer ID
     */
    async deleteAsync(id: number) {
        // Ensure customer exists
        await this.getByIdAsync(id);

        try {
            return await this.prisma.$transaction(async (tx) => {
                // Soft delete customer
                const deletedCustomer = await tx.customer.update({
                    where: { id },
                    data: { is_deleted: true }
                });

                // Soft delete customer's vehicles
                await tx.customer_vehicle.updateMany({
                    where: { customer_id: id },
                    data: { is_deleted: true }
                });

                return deletedCustomer;
            });
        } catch (error) {
            console.error('Error soft deleting customer:', error);
            throw new InternalServerErrorException('Failed to delete customer.');
        }
    }

    /**
     * Updates an existing customer vehicle
     * @param customerId The customer ID (owner)
     * @param vehicleId The vehicle ID
     * @param dto Data to update
     */
    async updateVehicleAsync(customerId: number, vehicleId: number, dto: UpdateCustomerVehicleDto) {
        // Ensure vehicle exists and belongs to this customer
        const vehicle = await this.prisma.customer_vehicle.findFirst({
            where: { id: vehicleId, customer_id: customerId, is_deleted: false },
        });

        if (!vehicle) {
            throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
        }

        if (vehicle.customer_id !== customerId) {
            throw new BadRequestException('You do not have permission to update this vehicle');
        }

        try {
            const updatedVehicle = await this.prisma.customer_vehicle.update({
                where: { id: vehicleId, customer_id: customerId, is_deleted: false },
                data: dto,
            });

            return updatedVehicle;
        } catch (error) {
            throw new InternalServerErrorException('Failed to update vehicle.');
        }
    }

    /**
     * Soft deletes a specific vehicle for a customer
     * @param customerId The customer ID (owner)
     * @param vehicleId The vehicle ID
     */
    async deleteVehicleAsync(customerId: number, vehicleId: number) {
        // Ensure vehicle exists and belongs to this customer
        const vehicle = await this.prisma.customer_vehicle.findFirst({
            where: { id: vehicleId, customer_id: customerId, is_deleted: false },
        });

        if (!vehicle) {
            throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
        }

        if (vehicle.customer_id !== customerId) {
            throw new BadRequestException('You do not have permission to delete this vehicle');
        }

        try {
            await this.prisma.customer_vehicle.update({
                where: { id: vehicleId, customer_id: customerId },
                data: { is_deleted: true },
            });
        } catch (error) {throw new InternalServerErrorException('Failed to delete vehicle.');
        }
    }

    /**
     * Gets a specific vehicle by ID
     * @param customerId The customer ID (owner)
     * @param vehicleId The vehicle ID
     */
    async getVehicleByIdAsync(customerId: number, vehicleId: number) {
        const vehicle = await this.prisma.customer_vehicle.findFirst({
            where: { id: vehicleId, customer_id: customerId, is_deleted: false },
        });

        if (!vehicle) {
            throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
        }

        if (vehicle.customer_id !== customerId) {
            throw new BadRequestException('You do not have permission to access this vehicle');
        }

        return vehicle;
    }

    /**
     * Updates customer profile information
     * @param id Customer ID
     * @param dto Update data
     */
    async updateAsync(id: number, dto: any) {
        // Ensure customer exists
        await this.getByIdAsync(id);

        // Check for duplicates if email or number is being updated
        if (dto.email || dto.number) {
            const existing = await this.prisma.customer.findFirst({
                where: {
                    id: { not: id },
                    OR: [
                        dto.email ? { email: dto.email } : {},
                        dto.number ? { number: dto.number } : {},
                    ].filter(q => Object.keys(q).length > 0)
                }
            });

            if (existing) {
                if (existing.email === dto.email) throw new BadRequestException('Email already in use');
                if (existing.number === dto.number) throw new BadRequestException('Mobile number already in use');
            }
        }

        return await this.prisma.customer.update({
            where: { id },
            data: dto,
            include: {
                customer_vehicles: {
                    where: { is_deleted: false }
                }
            }
        });
    }
}
