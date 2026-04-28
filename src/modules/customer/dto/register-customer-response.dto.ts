import { ApiProperty } from '@nestjs/swagger';

export class RegisterCustomerResponseDto {
    @ApiProperty({ description: 'JWT Access Token' })
    access_token: string;

    @ApiProperty({ description: 'JWT Refresh Token' })
    refresh_token: string;
}
