import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactInquiryDto } from './dto/create-contact-inquiry.dto';
import { ContactInquiryDto } from './dto/contact-inquiry.dto';
import { ResponseDto } from '../../core/response/dto/response.dto';
import { ApiResponseDto } from '../../core/response/decorators/api-response-dto.decorator';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly _contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new contact inquiry' })
  @ApiResponseDto(ContactInquiryDto, false, 201)
  async submitInquiry(
    @Body() dto: CreateContactInquiryDto,
  ): Promise<ResponseDto<ContactInquiryDto>> {
    const inquiry = await this._contactService.createInquiryAsync(dto);
    return ResponseDto.created('Inquiry submitted successfully', inquiry);
  }

  @Get()
  @ApiOperation({ summary: 'List all contact inquiries' })
  @ApiResponseDto(ContactInquiryDto, true)
  async findAll(): Promise<ResponseDto<ContactInquiryDto[]>> {
    const inquiries = await this._contactService.findAllAsync();
    return ResponseDto.retrieved('Inquiries retrieved successfully', inquiries);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single contact inquiry by ID' })
  @ApiResponseDto(ContactInquiryDto)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<ContactInquiryDto>> {
    const inquiry = await this._contactService.findOneAsync(id);
    return ResponseDto.retrieved('Inquiry retrieved successfully', inquiry);
  }
}
