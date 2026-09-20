import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LeadReviewService } from './lead-review.service';
import { CreateLeadReviewDto } from './dto/create-lead-review.dto';
import { ReviewItemDto, ReviewStatusDto } from '../review/dto/review-response.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { ResponseDto } from 'src/core/response/dto/response.dto';

@ApiTags('Lead Review')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LeadReviewController {
  constructor(private readonly _leadReviewService: LeadReviewService) {}

  /**
   * Submit a review for a completed lead.
   */
  @Post(['lead/reviews', 'leads/reviews', 'lead/review', 'leads/review', 'lead-reviews', 'lead-orders/reviews'])
  @ApiOperation({
    summary: 'Submit a review for a completed lead',
    description:
      'Creates a review for a completed or closed lead.\n\n' +
      '**Reviewer** is determined from the authenticated JWT user.\n\n' +
      '**Reviewee** is automatically derived from the lead:\n' +
      '- Customer → reviews the assigned Driver\n' +
      '- Driver → reviews the Customer\n\n' +
      'Constraints:\n' +
      '- Lead must be in `Completed` or `Closed` order_status\n' +
      '- Only one review per reviewer per lead\n' +
      '- Rating must be between 1 and 5\n' +
      '- Tags must be from the allowed set for the reviewer type',
  })
  @ApiResponseDto(ReviewItemDto, false, 201)
  async create(@Body() dto: CreateLeadReviewDto): Promise<ResponseDto<ReviewItemDto>> {
    const review = await this._leadReviewService.createReviewAsync(dto);
    return ResponseDto.created('Lead review submitted successfully', review);
  }

  /**
   * Get review status for a specific lead.
   */
  @Get(['lead/:id/review-status', 'leads/:id/review-status', 'lead-orders/:id/review-status'])
  @ApiOperation({
    summary: 'Get review status for a lead',
    description:
      'Returns whether the customer and driver have submitted their reviews for a specific lead.',
  })
  @ApiParam({ name: 'id', description: 'Numeric ID of the lead', example: 1 })
  @ApiResponseDto(ReviewStatusDto, false, 200)
  async getReviewStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseDto<ReviewStatusDto>> {
    const status = await this._leadReviewService.getReviewStatusAsync(id);
    return ResponseDto.retrieved('Review status fetched successfully', status);
  }
}
