import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { DealerPackagePlanService } from './dealer-package-plan.service';
import { CreateDealerPackagePlanDto } from './dto/create-dealer-package-plan.dto';
import { UpdateDealerPackagePlanDto } from './dto/update-dealer-package-plan.dto';
import { DealerPackagePlanQueryDto } from './dto/dealer-package-plan-query.dto';
import { DealerPackagePlanDto } from './dto/dealer-package-plan-response.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto, ApiResponseDtoNull } from 'src/core/response/decorators/api-response-dto.decorator';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { AdminGuard } from 'src/services/jwt/guards/admin.guard';

@ApiTags('Dealer Package Plan')
@Controller('dealer-package-plan')
export class DealerPackagePlanController {
  constructor(private readonly planService: DealerPackagePlanService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all active dealer package plans (Optional ?segment=Basic|Standard|Premium to resolve price)',
  })
  @ApiResponseDto(DealerPackagePlanDto, true)
  async findAllActive(
    @Query() query: DealerPackagePlanQueryDto,
  ): Promise<ResponseDto<DealerPackagePlanDto[]>> {
    const plans = await this.planService.findAllActiveAsync(query.segment);
    return ResponseDto.retrieved(
      'Active dealer package plans retrieved successfully',
      plans as any,
    );
  }

  @Get('all')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get all package plans (Admin only)' })
  @ApiResponseDto(DealerPackagePlanDto, true)
  async findAll(): Promise<ResponseDto<DealerPackagePlanDto[]>> {
    const plans = await this.planService.findAllAsync();
    return ResponseDto.retrieved(
      'All dealer package plans retrieved successfully',
      plans as any,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single dealer package plan by ID' })
  @ApiResponseDto(DealerPackagePlanDto)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<DealerPackagePlanDto>> {
    const plan = await this.planService.findOneAsync(id);
    return ResponseDto.retrieved(
      'Dealer package plan retrieved successfully',
      plan as any,
    );
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create a new package plan (Admin only)' })
  @ApiBody({ type: CreateDealerPackagePlanDto })
  @ApiResponseDto(DealerPackagePlanDto, false, 201)
  async createPlan(
    @Body() dto: CreateDealerPackagePlanDto,
  ): Promise<ResponseDto<DealerPackagePlanDto>> {
    const plan = await this.planService.createPlanAsync(dto);
    return ResponseDto.created(
      'Dealer package plan created successfully',
      plan as any,
    );
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update an existing package plan (Admin only)' })
  @ApiBody({ type: UpdateDealerPackagePlanDto })
  @ApiResponseDto(DealerPackagePlanDto)
  async updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDealerPackagePlanDto,
  ): Promise<ResponseDto<DealerPackagePlanDto>> {
    const plan = await this.planService.updatePlanAsync(id, dto);
    return ResponseDto.updated(
      'Dealer package plan updated successfully',
      plan as any,
    );
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Deactivate a package plan (Admin only)' })
  @ApiResponseDtoNull()
  async deletePlan(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<null>> {
    await this.planService.deletePlanAsync(id);
    return ResponseDto.deleted('Dealer package plan deactivated successfully');
  }
}
