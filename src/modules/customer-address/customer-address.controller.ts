import { Controller, Post, Get, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CustomerAddressService } from './customer-address.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { CustomerAddressResponseDto } from './dto/customer-address-response.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CustomerGuard } from 'src/services/jwt/guards/customer.guard';
import { CallerService } from 'src/services/jwt/caller.service';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto, ApiResponseDtoNull } from 'src/core/response/decorators/api-response-dto.decorator';

@ApiTags('Customer Address')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, CustomerGuard)
@Controller('customer/address')
export class CustomerAddressController {
  constructor(
    private readonly addressService: CustomerAddressService,
    private readonly callerService: CallerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Save a new address for the authenticated customer' })
  @ApiBody({ type: CreateCustomerAddressDto })
  @ApiResponseDto(CustomerAddressResponseDto, false, 201)
  async create(@Body() dto: CreateCustomerAddressDto) {
    const customerId = this.callerService.getUserId();
    const result = await this.addressService.createAsync(customerId, dto);
    return ResponseDto.created('Address saved successfully', result);
  }

  @Get()
  @ApiOperation({ summary: 'List all saved addresses for the authenticated customer' })
  @ApiResponseDto(CustomerAddressResponseDto, true)
  async getList() {
    const customerId = this.callerService.getUserId();
    const result = await this.addressService.getByCustomerIdAsync(customerId);
    return ResponseDto.retrieved('Addresses retrieved successfully', result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a saved address' })
  @ApiBody({ type: UpdateCustomerAddressDto })
  @ApiResponseDto(CustomerAddressResponseDto)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
    const customerId = this.callerService.getUserId();
    const result = await this.addressService.updateAsync(customerId, id, dto);
    return ResponseDto.updated('Address updated successfully', result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved address' })
  @ApiResponseDtoNull()
  async delete(@Param('id', ParseIntPipe) id: number) {
    const customerId = this.callerService.getUserId();
    await this.addressService.deleteAsync(customerId, id);
    return ResponseDto.deleted('Address deleted successfully');
  }
}
