import { Body, Controller, Delete, Param, ParseIntPipe, Post, Get, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { RegisterCustomerDto, RegisterCustomerVehicleDto } from './dto/register-customer.dto';
import { RegisterCustomerResponseDto } from './dto/register-customer-response.dto';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto, ApiResponseDtoNull } from 'src/core/response/decorators/api-response-dto.decorator';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CallerService } from 'src/services/jwt/caller.service';

@ApiTags('Customer')
@Controller('customer')
export class CustomerController {
    constructor(
        private readonly customerService: CustomerService,
        private readonly callerService: CallerService
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new customer and their vehicle' })
    @ApiBody({ type: RegisterCustomerDto })
    @ApiResponseDto(RegisterCustomerResponseDto, false, 201)
    async register(@Body() registerCustomerDto: RegisterCustomerDto) {
        const result = await this.customerService.registerCustomerAsync(registerCustomerDto);
        return ResponseDto.created('Customer registration successful', result);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Post('vehicle')
    @ApiOperation({ summary: 'Add a new vehicle to the authenticated customer' })
    @ApiBody({ type: RegisterCustomerVehicleDto })
    @ApiResponseDtoNull(201)
    async addVehicle(
        @Body() addVehicleDto: RegisterCustomerVehicleDto
    ) {
        const id = this.callerService.getUserId();
        const result = await this.customerService.addVehicleAsync(id, addVehicleDto);
        return ResponseDto.created('Vehicle added successfully', result);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('vehicles')
    @ApiOperation({ summary: 'List all vehicles for the authenticated customer' })
    @ApiResponseDtoNull(200)
    async getVehicles() {
        const id = this.callerService.getUserId();
        const result = await this.customerService.getVehiclesAsync(id);
        return ResponseDto.retrieved('Vehicles retrieved successfully', result);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete a customer' })
    @ApiResponseDtoNull(200)
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.customerService.deleteAsync(id);
        return ResponseDto.deleted('Customer deleted successfully');
    }
}
