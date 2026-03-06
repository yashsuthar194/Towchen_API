import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    ValidateNested,
} from 'class-validator';

export class RegisterCustomerVehicleDto {
    @ApiProperty({ example: 'Toyota', description: 'Vehicle make or company name' })
    @IsNotEmpty()
    @IsString()
    make: string;

    @ApiProperty({ example: 'Corolla', description: 'Vehicle model' })
    @IsNotEmpty()
    @IsString()
    model: string;

    @ApiProperty({ example: 'MH01AB1234', description: 'Vehicle registration number' })
    @IsNotEmpty()
    @IsString()
    registration_number: string;

    @ApiProperty({ example: 'SUV', description: 'Vehicle class' })
    @IsNotEmpty()
    @IsString()
    class: string;

    @ApiProperty({ example: 'Petrol', description: 'Vehicle fuel type' })
    @IsNotEmpty()
    @IsString()
    fuel_type: string;
}

export class RegisterCustomerDto {
    @ApiProperty({ example: 'John Doe', description: 'Full name of the customer' })
    @IsNotEmpty()
    @IsString()
    full_name: string;

    @ApiProperty({ example: '9876543210', description: 'Mobile number of the customer' })
    @IsNotEmpty()
    @IsString()
    number: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email address of the customer' })
    @IsNotEmpty()
    @IsEmail()
    @Transform(({ value }) => value.toLowerCase())
    email: string;

    @ApiProperty({ type: RegisterCustomerVehicleDto, description: 'Vehicle details of the customer' })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => RegisterCustomerVehicleDto)
    vehicle: RegisterCustomerVehicleDto;
}
