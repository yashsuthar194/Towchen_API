import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { VendorGuard } from 'src/services/jwt/guards/vendor.guard';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';

@ApiTags('Lead')
@Controller('lead')
export class LeadController {
  constructor(private readonly _leadService: LeadService) {}

  @Post()
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponseDto(ResponseDto)
  async create(@Req() req, @Body() createLeadDto: CreateLeadDto) {
    const vendorId = req.user.id;
    const lead = await this._leadService.create(vendorId, createLeadDto);
    return ResponseDto.created('Lead created successfully', lead);
  }
}
