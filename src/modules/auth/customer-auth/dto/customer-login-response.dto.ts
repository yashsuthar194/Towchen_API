import { ApiProperty } from '@nestjs/swagger';

export class CustomerLoginResponseDto {
    @ApiProperty({ description: 'JWT Access Token', required: false })
    access_token?: string;

    @ApiProperty({ description: 'JWT Refresh Token', required: false })
    refresh_token?: string;

    @ApiProperty({ description: 'Indicates if the customer is already registered' })
    is_registered: boolean;
}
