import { IsString, IsEnum, IsDate } from 'class-validator';
import { FleetType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateVehicleDto {
    @ApiProperty({ enum: FleetType })
    @IsEnum(FleetType)
    fleet_type: FleetType;

    @IsString()
    fleet_location: string;

    @IsString()
    registration_number: string;

    @IsString()
    make: string;

    @IsString()
    model: string;

    @IsString()
    owner_name: string;

    @IsString()
    chassis_number: string;

    @IsString()
    engine_number: string;

    @IsDate()
    @Transform(({ value }) => {
        if (!value) return value;
        let date: Date;
        if (typeof value === 'string' && value.includes('/')) {
            const [day, month, year] = value.split('/').map(Number);
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(value);
        }
        return isNaN(date.getTime()) ? value : date;
    })
    vehicle_validity: Date;

    @IsDate()
    @Transform(({ value }) => {
        if (!value) return value;
        let date: Date;
        if (typeof value === 'string' && value.includes('/')) {
            const [day, month, year] = value.split('/').map(Number);
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(value);
        }
        return isNaN(date.getTime()) ? value : date;
    })
    insurance_validity: Date;

    @IsDate()
    @Transform(({ value }) => {
        if (!value) return value;
        let date: Date;
        if (typeof value === 'string' && value.includes('/')) {
            const [day, month, year] = value.split('/').map(Number);
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(value);
        }
        return isNaN(date.getTime()) ? value : date;
    })
    fitness_validity: Date;

    @IsDate()
    @Transform(({ value }) => {
        if (!value) return value;
        let date: Date;
        if (typeof value === 'string' && value.includes('/')) {
            const [day, month, year] = value.split('/').map(Number);
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(value);
        }
        return isNaN(date.getTime()) ? value : date;
    })
    puc_validity: Date;

    /**
     * Extracts vehicle-only data
     */
    static toVehicleData(dto: CreateVehicleDto) {
        return dto;
    }
}
