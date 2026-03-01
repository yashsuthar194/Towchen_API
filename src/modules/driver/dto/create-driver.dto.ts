import { IsString, IsEmail, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDriverDto {
    @IsString()
    full_name: string;

    @IsString()
    number: string;

    @IsString()
    alternate_number: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    vehicle_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    vendor_id?: number;

    /**
     * Extracts driver-only data
     */
    static toDriverData(dto: CreateDriverDto) {
        const { vehicle_id, ...driverData } = dto;
        return driverData;
    }
}
