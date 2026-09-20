import { Controller, Get, Post, Param, UseGuards, Req, ParseIntPipe, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CustomerLeadService } from './customer-lead.service';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CustomerGuard } from 'src/services/jwt/guards/customer.guard';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { FilterLeadDto } from './dto/filter-lead.dto';

@ApiTags('Customer Lead')
@Controller(['customer/lead', 'customer/leads'])
@UseGuards(JwtAuthGuard, CustomerGuard)
@ApiBearerAuth('JWT-auth')
export class CustomerLeadController {
  constructor(private readonly _customerLeadService: CustomerLeadService) {}

  @Get('available')
  @Post()
  @ApiOperation({ summary: 'List all available leads with optional filtering' })
  @ApiResponseDto(ResponseDto)
  async listAvailableLeads(@Body() filterLeadDto?: FilterLeadDto) {
    const leads = await this._customerLeadService.getAvailableLeads(filterLeadDto || {});
    return ResponseDto.success('Available leads retrieved successfully', leads);
  }

  @Post(':id/book')
  @ApiOperation({ summary: 'Book a specific lead' })
  @ApiParam({ name: 'id', description: 'Numeric ID of the lead', example: 1 })
  @ApiResponseDto(ResponseDto)
  async bookLead(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const customerId = req.user.id;
    const order = await this._customerLeadService.bookLead(customerId, id);
    return ResponseDto.success('Lead booked successfully', order);
  }

  @Get(['booked', 'orders'])
  @ApiOperation({ summary: 'Get all booked leads for the current customer' })
  @ApiResponseDto(ResponseDto)
  async getCustomerLeadOrders(@Req() req) {
    const customerId = req.user.id;
    const orders = await this._customerLeadService.getLeadOrdersForCustomer(customerId);
    return ResponseDto.success('Customer booked leads retrieved successfully', orders);
  }

  @Get([':id', 'booked/:id', 'orders/:id'])
  @ApiOperation({ summary: 'Get details of a specific booked lead for customer' })
  @ApiParam({ name: 'id', description: 'Numeric ID of the lead', example: 1 })
  @ApiResponseDto(ResponseDto)
  async getCustomerLeadOrderById(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const customerId = req.user.id;
    const order = await this._customerLeadService.getLeadOrderById(id, customerId);
    return ResponseDto.success('Booked lead details retrieved successfully', order);
  }

  @Get([':id/otp', 'booked/:id/otp', 'orders/:id/otp'])
  @ApiOperation({ summary: 'Get OTPs for a booked lead (Customer only)' })
  @ApiParam({ name: 'id', description: 'Numeric ID of the lead', example: 1 })
  @ApiResponseDto(ResponseDto)
  async getLeadOrderOtps(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const customerId = req.user.id;
    const otps = await this._customerLeadService.getLeadOrderOtpsAsync(id, customerId);
    return ResponseDto.success('Booked lead OTPs retrieved successfully', otps);
  }
}
