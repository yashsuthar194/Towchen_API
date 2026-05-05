import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { BulkCreateDummyAddressDto } from './dto/create-dummy-address.dto';
import { SearchDummyAddressDto } from './dto/search-dummy-address.dto';

@Injectable()
export class DummyAddressService {
    constructor(private readonly prisma: PrismaService) {}

    async bulkInsertAsync(dto: BulkCreateDummyAddressDto) {
        try {
            const result = await this.prisma.dummy_address.createMany({
                data: dto.addresses,
                skipDuplicates: true,
            });

            return { count: result.count };
        } catch (error) {
            console.error('Error bulk inserting dummy addresses:', error);
            throw new InternalServerErrorException('Failed to insert dummy addresses.');
        }
    }

    async searchAsync(params: SearchDummyAddressDto) {
        try {
            const { query } = params;
            
            const whereClause: any = {};

            if (query) {
                whereClause.OR = [
                    { address: { contains: query, mode: 'insensitive' } },
                    { street: { contains: query, mode: 'insensitive' } },
                    { area: { contains: query, mode: 'insensitive' } },
                    { landmark: { contains: query, mode: 'insensitive' } },
                    { city: { contains: query, mode: 'insensitive' } },
                    { state: { contains: query, mode: 'insensitive' } },
                    { pincode: { contains: query, mode: 'insensitive' } },
                ];
            }

            const results = await this.prisma.dummy_address.findMany({
                where: whereClause,
                orderBy: {
                    created_at: 'desc',
                },
                // Limit the results to prevent massive payloads if no filters are applied
                take: 100,
            });

            return results;
        } catch (error) {
            console.error('Error searching dummy addresses:', error);
            throw new InternalServerErrorException('Failed to search dummy addresses.');
        }
    }
}
