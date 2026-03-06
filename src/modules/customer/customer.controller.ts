import { Body, Controller, Delete, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto, ApiResponseDtoNull } from 'src/core/response/decorators/api-response-dto.decorator';

@ApiTags('Customer')
@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new customer and their vehicle' })
    @ApiBody({ type: RegisterCustomerDto })
    @ApiResponseDto(RegisterCustomerDto, false, 201)
    async register(@Body() registerCustomerDto: RegisterCustomerDto) {
        const customer = await this.customerService.registerCustomerAsync(registerCustomerDto);
        return ResponseDto.created('Customer registration successful', customer);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete a customer' })
    @ApiResponseDtoNull(200)
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.customerService.deleteAsync(id);
        return ResponseDto.deleted('Customer deleted successfully');
    }
}
