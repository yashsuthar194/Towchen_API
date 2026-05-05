import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SearchDummyAddressDto {
    @ApiProperty({ required: false, description: 'Search term for generic search (address, street, area, landmark, city, state, pincode)' })
    @IsOptional()
    @IsString()
    query?: string;
}
