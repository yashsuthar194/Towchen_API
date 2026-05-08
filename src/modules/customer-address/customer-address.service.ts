import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { CustomerAddressResponseDto } from './dto/customer-address-response.dto';
import { LocationService } from '../location/location.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class CustomerAddressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationService: LocationService,
  ) { }

  /**
   * Creates a new saved address for the customer using a Google Maps place_id.
   * Resolves the place_id into a full address object before storing.
   */
  async createAsync(customerId: number, dto: CreateCustomerAddressDto): Promise<CustomerAddressResponseDto> {
    // 1. Check for duplicate label for this customer
    const existingLabel = await this.prisma.customer_address.findFirst({
      where: { customer_id: customerId, label: dto.label },
    });
    if (existingLabel) {
      throw new BadRequestException(`Address with label "${dto.label}" already exists`);
    }

    // 2. Resolve the place_id to get full address details
    const resolvedAddress = await this.locationService.resolveAddressAsync({ place_id: dto.place_id });

    // 3. Handle default address logic
    const addressCount = await this.prisma.customer_address.count({
      where: { customer_id: customerId },
    });

    let isDefault = dto.is_default ?? false;
    if (addressCount === 0) {
      isDefault = true;
    }

    if (isDefault) {
      await this.clearDefaults(customerId);
    }

    // 4. Create the saved address in the database
    const address = await this.prisma.customer_address.create({
      data: {
        customer_id: customerId,
        label: dto.label,
        is_default: isDefault,
        description: dto.description,
        // Map resolved fields to the model
        address: resolvedAddress.address,
        street: resolvedAddress.street,
        area: resolvedAddress.area,
        city: resolvedAddress.city,
        state: resolvedAddress.state,
        pincode: resolvedAddress.pincode,
        country: resolvedAddress.country,
        latitude: resolvedAddress.latitude,
        longitude: resolvedAddress.longitude,
        landmark: resolvedAddress.landmark,
      },
    });

    return address as CustomerAddressResponseDto;
  }

  /**
   * Retrieves all saved addresses for a specific customer.
   */
  async getByCustomerIdAsync(customerId: number): Promise<CustomerAddressResponseDto[]> {
    const addresses = await this.prisma.customer_address.findMany({
      where: { customer_id: customerId },
      orderBy: { created_at: 'desc' },
    });

    return addresses as CustomerAddressResponseDto[];
  }

  /**
   * Updates a specific saved address.
   * Note: This usually only updates the label, is_default, or description.
   * If the user wants to change the location itself, they should delete and re-add.
   */
  async updateAsync(customerId: number, id: number, dto: UpdateCustomerAddressDto): Promise<CustomerAddressResponseDto> {
    const existing = await this.prisma.customer_address.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (existing.customer_id !== customerId) {
      throw new ForbiddenException('You do not have permission to update this address');
    }

    if (dto.is_default) {
      await this.clearDefaults(customerId);
    }

    const updated = await this.prisma.customer_address.update({
      where: { id },
      data: {
        label: dto.label,
        is_default: dto.is_default,
        description: dto.description,
      },
    });

    return updated as CustomerAddressResponseDto;
  }

  /**
   * Deletes a specific saved address.
   */
  async deleteAsync(customerId: number, id: number): Promise<void> {
    const existing = await this.prisma.customer_address.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }

    if (existing.customer_id !== customerId) {
      throw new ForbiddenException('You do not have permission to delete this address');
    }

    await this.prisma.customer_address.delete({
      where: { id },
    });
  }

  /**
   * Helper method to set all addresses for a customer as non-default.
   */
  private async clearDefaults(customerId: number): Promise<void> {
    await this.prisma.customer_address.updateMany({
      where: { customer_id: customerId, is_default: true },
      data: { is_default: false },
    });
  }
}
