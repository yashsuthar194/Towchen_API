import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CustomerLoginDto {
    @ApiProperty({ example: '9876543210', description: 'Mobile number of the customer' })
    @IsNotEmpty()
    @IsString()
    number: string;
}
