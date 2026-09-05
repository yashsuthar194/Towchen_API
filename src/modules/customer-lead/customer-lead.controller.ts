import { Controller, Get, Post, Param, UseGuards, Req, ParseIntPipe, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerLeadService } from './customer-lead.service';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CustomerGuard } from 'src/services/jwt/guards/customer.guard';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { FilterLeadDto } from './dto/filter-lead.dto';

@ApiTags('Customer Lead')
@Controller('customer/lead')
@UseGuards(JwtAuthGuard, CustomerGuard)
@ApiBearerAuth()
export class CustomerLeadController {
  constructor(private readonly _customerLeadService: CustomerLeadService) {}

  @Post()
  @ApiOperation({ summary: 'List all available leads with optional filtering' })
  @ApiResponseDto(ResponseDto)
  async listAvailableLeads(@Body() filterLeadDto: FilterLeadDto) {
    const leads = await this._customerLeadService.getAvailableLeads(filterLeadDto);
    return ResponseDto.success('Available leads retrieved successfully', leads);
  }

  @Post(':id/book')
  @ApiOperation({ summary: 'Book a specific lead' })
  @ApiResponseDto(ResponseDto)
  async bookLead(@Req() req, @Param('id', ParseIntPipe) id: number) {
    const customerId = req.user.id;
    const order = await this._customerLeadService.bookLead(customerId, id);
    return ResponseDto.success('Lead booked successfully', order);
  }
}
