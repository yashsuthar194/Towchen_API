import { Body, Controller, Delete, Param, ParseIntPipe, Post, Get, UseGuards, Put } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { RegisterCustomerDto, RegisterCustomerVehicleDto } from './dto/register-customer.dto';
import { UpdateCustomerVehicleDto } from './dto/update-customer-vehicle.dto';
import { RegisterCustomerResponseDto } from './dto/register-customer-response.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerDetailDto } from './dto/customer-detail.dto';
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

    @Get('list')
    @ApiOperation({ summary: 'Get list of all customers' })
    async getList() {
        const result = await this.customerService.getListAsync();
        return ResponseDto.retrieved('Customers retrieved successfully', result);
    }

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

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Put('vehicle/:id')
    @ApiOperation({ summary: 'Update a specific vehicle for the authenticated customer' })
    @ApiBody({ type: UpdateCustomerVehicleDto })
    @ApiResponseDtoNull(200)
    async updateVehicle(
        @Param('id', ParseIntPipe) vehicleId: number,
        @Body() dto: UpdateCustomerVehicleDto
    ) {
        const customerId = this.callerService.getUserId();
        const result = await this.customerService.updateVehicleAsync(customerId, vehicleId, dto);
        return ResponseDto.updated('Vehicle updated successfully', result);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Delete('vehicle/:id')
    @ApiOperation({ summary: 'Delete a specific vehicle for the authenticated customer' })
    @ApiResponseDtoNull(200)
    async deleteVehicle(
        @Param('id', ParseIntPipe) vehicleId: number
    ) {
        const customerId = this.callerService.getUserId();
        await this.customerService.deleteVehicleAsync(customerId, vehicleId);
        return ResponseDto.deleted('Vehicle deleted successfully');
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('vehicle/:id')
    @ApiOperation({ summary: 'Get details of a specific vehicle' })
    @ApiResponseDtoNull(200)
    async getVehicle(
        @Param('id', ParseIntPipe) vehicleId: number
    ) {
        const customerId = this.callerService.getUserId();
        const result = await this.customerService.getVehicleByIdAsync(customerId, vehicleId);
        return ResponseDto.retrieved('Vehicle details retrieved successfully', result);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Get('me')
    @ApiOperation({ summary: 'Get current customer profile' })
    @ApiResponseDto(CustomerDetailDto)
    async getProfile() {
        const customerId = this.callerService.getUserId();
        const result = await this.customerService.getByIdAsync(customerId);
        return ResponseDto.retrieved('Customer profile retrieved successfully', result);
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @Put('me/info')
    @ApiOperation({ summary: 'Update current customer profile info' })
    @ApiBody({ type: UpdateCustomerDto })
    @ApiResponseDto(CustomerDetailDto)
    async updateProfileInfo(
        @Body() dto: UpdateCustomerDto
    ) {
        const customerId = this.callerService.getUserId();
        const result = await this.customerService.updateAsync(customerId, dto);
        return ResponseDto.updated('Customer profile updated successfully', result);
    }
}
