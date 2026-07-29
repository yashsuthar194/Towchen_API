import { Controller, Get, Put, Delete, Param, Body, UseGuards, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { SuperAdminGuard } from 'src/services/jwt/guards/super-admin.guard';

@ApiTags('Admin Management')
@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly _adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active admins (SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'List of admins retrieved successfully' })
  async findAll() {
    const data = await this._adminService.findAll();
    return new ResponseDto(true, HttpStatus.OK, 'Admins retrieved successfully', data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific admin by ID (SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'Admin retrieved successfully' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this._adminService.findOne(id);
    return new ResponseDto(true, HttpStatus.OK, 'Admin retrieved successfully', data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an admin (SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'Admin updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    const data = await this._adminService.update(id, updateAdminDto);
    return new ResponseDto(true, HttpStatus.OK, 'Admin updated successfully', data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an admin (SuperAdmin only)' })
  @ApiResponse({ status: 200, description: 'Admin deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this._adminService.softDelete(id);
    return new ResponseDto(true, HttpStatus.OK, 'Admin deleted successfully', data);
  }
}
