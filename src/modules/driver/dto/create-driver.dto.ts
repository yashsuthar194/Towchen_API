import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

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

    @IsBoolean()
    @IsOptional()
    is_email_verified?: boolean;

    @IsBoolean()
    @IsOptional()
    is_number_verified?: boolean;

    @IsString()
    adhar_card_url: string;

    @IsString()
    pan_card_url: string;

    @IsString()
    driver_license_url: string;
}
