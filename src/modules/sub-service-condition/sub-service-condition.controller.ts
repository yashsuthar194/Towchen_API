import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubServiceConditionService } from './sub-service-condition.service';
import { CreateSubServiceConditionDto } from './dto/create-condition.dto';
import { UpdateSubServiceConditionDto } from './dto/update-condition.dto';
import { SubServiceConditionDto } from '../vendor/dto/service.dto';
import { ResponseDto } from '../../core/response/dto/response.dto';
import { ApiResponseDto, ApiResponseDtoNull } from '../../core/response/decorators/api-response-dto.decorator';

@ApiTags('Sub Service Condition')
@Controller('sub-service-condition')
export class SubServiceConditionController {
  constructor(private readonly _conditionService: SubServiceConditionService) {}

  @Get('sub-service/:subServiceId')
  @ApiOperation({ summary: 'Get all conditions for a specific sub-service' })
  @ApiResponseDto(SubServiceConditionDto, true)
  async getConditionsBySubService(
    @Param('subServiceId') subServiceId: number,
  ): Promise<ResponseDto<SubServiceConditionDto[]>> {
    const conditions = await this._conditionService.findConditionsBySubServiceIdAsync(subServiceId);
    return ResponseDto.retrieved('Conditions retrieved successfully', conditions);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new sub-service condition' })
  @ApiResponseDto(SubServiceConditionDto, false, 201)
  async createCondition(
    @Body() dto: CreateSubServiceConditionDto,
  ): Promise<ResponseDto<SubServiceConditionDto>> {
    const condition = await this._conditionService.createConditionAsync(dto);
    return ResponseDto.created('Condition created successfully', condition);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing sub-service condition' })
  @ApiResponseDto(SubServiceConditionDto)
  async updateCondition(
    @Param('id') id: number,
    @Body() dto: UpdateSubServiceConditionDto,
  ): Promise<ResponseDto<SubServiceConditionDto>> {
    const condition = await this._conditionService.updateConditionAsync(id, dto);
    return ResponseDto.updated('Condition updated successfully', condition);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sub-service condition' })
  @ApiResponseDtoNull()
  async deleteCondition(@Param('id') id: number): Promise<ResponseDto<null>> {
    await this._conditionService.deleteConditionAsync(id);
    return ResponseDto.deleted('Condition deleted successfully');
  }
}
