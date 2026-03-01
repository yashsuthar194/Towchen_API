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

}
