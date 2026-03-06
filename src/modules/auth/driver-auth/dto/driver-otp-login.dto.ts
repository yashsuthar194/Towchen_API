import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DriverOtpLoginDto {
    @ApiProperty({ example: '9876543210', description: 'Mobile number of the driver' })
    @IsNotEmpty()
    @IsString()
    number: string;
}
