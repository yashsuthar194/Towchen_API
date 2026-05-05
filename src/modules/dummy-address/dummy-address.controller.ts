import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { DummyAddressService } from './dummy-address.service';
import { BulkCreateDummyAddressDto } from './dto/create-dummy-address.dto';
import { SearchDummyAddressDto } from './dto/search-dummy-address.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { ApiResponseDtoNull } from 'src/core/response/decorators/api-response-dto.decorator';

@ApiTags('Dummy Address')
@Controller('dummy-address')
export class DummyAddressController {
    constructor(private readonly dummyAddressService: DummyAddressService) {}

    @Post('bulk')
    @ApiOperation({ summary: 'Bulk insert dummy addresses' })
    @ApiBody({ type: BulkCreateDummyAddressDto })
    @ApiResponseDtoNull(201)
    async bulkInsert(@Body() dto: BulkCreateDummyAddressDto) {
        const result = await this.dummyAddressService.bulkInsertAsync(dto);
        return ResponseDto.created(`Successfully inserted ${result.count} dummy addresses`, result);
    }

    @Get()
    @ApiOperation({ summary: 'Search and list dummy addresses' })
    @ApiResponseDtoNull(200)
    async search(@Query() params: SearchDummyAddressDto) {
        const result = await this.dummyAddressService.searchAsync(params);
        return ResponseDto.retrieved('Dummy addresses retrieved successfully', result);
    }
}
