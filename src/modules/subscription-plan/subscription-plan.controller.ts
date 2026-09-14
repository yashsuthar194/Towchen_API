import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionPlanService } from './subscription-plan.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlanDto } from './dto/subscription-plan.dto';
import { ResponseDto } from '../../core/response/dto/response.dto';
import { ApiResponseDto, ApiResponseDtoNull } from '../../core/response/decorators/api-response-dto.decorator';
import { JwtAuthGuard } from '../../services/jwt/guards/jwt-auth.guard';
import { AdminGuard } from '../../services/jwt/guards/admin.guard';

@ApiTags('Subscription Plan')
@Controller('subscription-plan')
export class SubscriptionPlanController {
  constructor(private readonly subscriptionPlanService: SubscriptionPlanService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active subscription plans' })
  @ApiResponseDto(SubscriptionPlanDto, true)
  async findAllActive(): Promise<ResponseDto<SubscriptionPlanDto[]>> {
    const plans = await this.subscriptionPlanService.findAllActiveAsync();
    return ResponseDto.retrieved('Active subscription plans retrieved successfully', plans as any);
  }

  @Get('all')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Get all subscription plans (Admin only)' })
  @ApiResponseDto(SubscriptionPlanDto, true)
  async findAll(): Promise<ResponseDto<SubscriptionPlanDto[]>> {
    const plans = await this.subscriptionPlanService.findAllAsync();
    return ResponseDto.retrieved('All subscription plans retrieved successfully', plans as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single subscription plan by ID' })
  @ApiResponseDto(SubscriptionPlanDto)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<SubscriptionPlanDto>> {
    const plan = await this.subscriptionPlanService.findOneAsync(id);
    return ResponseDto.retrieved('Subscription plan retrieved successfully', plan as any);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Create a new subscription plan (Admin only)' })
  @ApiResponseDto(SubscriptionPlanDto, false, 201)
  async createPlan(@Body() dto: CreateSubscriptionPlanDto): Promise<ResponseDto<SubscriptionPlanDto>> {
    const plan = await this.subscriptionPlanService.createPlanAsync(dto);
    return ResponseDto.created('Subscription plan created successfully', plan as any);
  }

  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Update an existing subscription plan (Admin only)' })
  @ApiResponseDto(SubscriptionPlanDto)
  async updatePlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionPlanDto,
  ): Promise<ResponseDto<SubscriptionPlanDto>> {
    const plan = await this.subscriptionPlanService.updatePlanAsync(id, dto);
    return ResponseDto.updated('Subscription plan updated successfully', plan as any);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Delete a subscription plan (Admin only)' })
  @ApiResponseDtoNull()
  async deletePlan(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<null>> {
    await this.subscriptionPlanService.deletePlanAsync(id);
    return ResponseDto.deleted('Subscription plan deleted successfully');
  }
}
