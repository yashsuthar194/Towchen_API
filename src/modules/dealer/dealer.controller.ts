import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { DealerService } from './dealer.service';
import { CreateDealerDto } from './dto/create-dealer.dto';
import { UpdateDealerDto } from './dto/update-dealer.dto';
import { DealerQueryDto } from './dto/dealer-query.dto';
import { DealerResponseDto, DealerListResponseDto } from './dto/dealer-response.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDto, ApiResponseDtoNull } from 'src/core/response/decorators/api-response-dto.decorator';

@ApiTags('Dealer')
@Controller('dealer')
export class DealerController {
  constructor(private readonly dealerService: DealerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dealer' })
  @ApiBody({ type: CreateDealerDto })
  @ApiResponseDto(DealerResponseDto, false, 201)
  async create(@Body() createDealerDto: CreateDealerDto) {
    const result = await this.dealerService.createAsync(createDealerDto);
    return ResponseDto.created('Dealer created successfully', result);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dealers with search and pagination' })
  @ApiResponseDto(DealerListResponseDto, false, 200)
  async findAll(@Query() query: DealerQueryDto) {
    const result = await this.dealerService.findAllAsync(query);
    return ResponseDto.retrieved('Dealers retrieved successfully', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dealer details by ID' })
  @ApiResponseDto(DealerResponseDto, false, 200)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.dealerService.findOneAsync(id);
    return ResponseDto.retrieved('Dealer retrieved successfully', result);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update dealer by ID' })
  @ApiBody({ type: UpdateDealerDto })
  @ApiResponseDto(DealerResponseDto, false, 200)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDealerDto: UpdateDealerDto,
  ) {
    const result = await this.dealerService.updateAsync(id, updateDealerDto);
    return ResponseDto.updated('Dealer updated successfully', result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete dealer by ID' })
  @ApiResponseDtoNull(200)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.dealerService.deleteAsync(id);
    return ResponseDto.deleted('Dealer deleted successfully');
  }
}
