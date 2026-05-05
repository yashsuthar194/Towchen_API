import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateDummyAddressDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    street?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    area?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    pincode?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    country?: string;

    @ApiProperty()
    @IsNumber()
    latitude: number;

    @ApiProperty()
    @IsNumber()
    longitude: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    landmark?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;
}

export class BulkCreateDummyAddressDto {
    @ApiProperty({ type: [CreateDummyAddressDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDummyAddressDto)
    addresses: CreateDummyAddressDto[];
}
