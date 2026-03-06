import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Injectable()
export class CustomerService {
    constructor(private readonly prisma: PrismaService) { }

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

            return newCustomer;
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
}
