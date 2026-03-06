import { Body, Controller, Post } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerOtpVerificationDto } from './dto/customer-otp-verification.dto';
import { CustomerLoginResponseDto } from './dto/customer-login-response.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto, ApiResponseDtoNull } from 'src/core/response/decorators/api-response-dto.decorator';

@ApiTags('Customer Auth')
@Controller('customer-auth')
export class CustomerAuthController {
    constructor(private readonly _customerAuthService: CustomerAuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Request a login OTP for a customer' })
    @ApiBody({ type: CustomerLoginDto })
    @ApiResponseDtoNull(201)
    async login(@Body() loginDto: CustomerLoginDto): Promise<ResponseDto<null>> {
        return this._customerAuthService.sendLoginOtpAsync(loginDto);
    }

    @Post('login/verify')
    @ApiOperation({ summary: 'Verify login OTP and get JWT tokens' })
    @ApiBody({ type: CustomerOtpVerificationDto })
    @ApiResponseDto(CustomerLoginResponseDto)
    async verify(@Body() verificationDto: CustomerOtpVerificationDto): Promise<ResponseDto<CustomerLoginResponseDto>> {
        return this._customerAuthService.verifyLoginOtpAsync(verificationDto);
    }
}
