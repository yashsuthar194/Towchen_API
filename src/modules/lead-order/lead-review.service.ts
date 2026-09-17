import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CallerService } from 'src/services/jwt/caller.service';
import { CreateLeadReviewDto } from './dto/create-lead-review.dto';
import { ReviewItemDto, ReviewStatusDto } from '../review/dto/review-response.dto';
import { OrderStatus, ReviewUserType } from '@prisma/client';

const CUSTOMER_TO_DRIVER_TAGS = [
  'Professional',
  'Friendly',
  'On Time',
  'Safe Driving',
  'Helpful',
  'Good Communication',
  'Vehicle Handled Carefully',
];

const DRIVER_TO_CUSTOMER_TAGS = [
  'Respectful',
  'Good Communication',
  'Ready On Arrival',
  'Paid Promptly',
  'Accurate Pickup Location',
];

@Injectable()
export class LeadReviewService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _callerService: CallerService,
  ) {}

  /**
   * Creates a review for a completed lead order.
   * Determines reviewer/reviewee from authenticated user and lead order.
   * Updates rating aggregation in a single transaction.
   */
  async createReviewAsync(dto: CreateLeadReviewDto): Promise<ReviewItemDto> {
    const userId = this._callerService.getUserId();

    let reviewerType: ReviewUserType;
    if (this._callerService.isCustomer()) {
      reviewerType = ReviewUserType.Customer;
    } else if (this._callerService.isDriver()) {
      reviewerType = ReviewUserType.Driver;
    } else {
      throw new ForbiddenException('Only customers and drivers can submit reviews');
    }

    const leadOrder = await this._prisma.lead_order.findUnique({
      where: { id: dto.leadOrderId },
    });

    if (!leadOrder) {
      throw new NotFoundException(`Lead order with ID ${dto.leadOrderId} not found`);
    }

    if (leadOrder.status !== OrderStatus.Completed && leadOrder.status !== OrderStatus.Closed) {
      throw new BadRequestException('Reviews can only be submitted for completed or closed lead orders');
    }

    if (!leadOrder.driver_id) {
      throw new BadRequestException('No driver assigned to this lead order');
    }

    if (!leadOrder.customer_id) {
      throw new BadRequestException('No customer assigned to this lead order');
    }

    let revieweeType: ReviewUserType;
    let revieweeId: number;

    if (reviewerType === ReviewUserType.Customer) {
      if (leadOrder.customer_id !== userId) {
        throw new ForbiddenException('You are not the customer for this lead order');
      }
      revieweeType = ReviewUserType.Driver;
      revieweeId = leadOrder.driver_id;
    } else {
      if (leadOrder.driver_id !== userId) {
        throw new ForbiddenException('You are not the assigned driver for this lead order');
      }
      revieweeType = ReviewUserType.Customer;
      revieweeId = leadOrder.customer_id;
    }

    const existingReview = await this._prisma.lead_review.findUnique({
      where: {
        lead_order_id_reviewer_type_reviewer_id: {
          lead_order_id: dto.leadOrderId,
          reviewer_type: reviewerType,
          reviewer_id: userId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already submitted a review for this lead order');
    }

    if (dto.tags && dto.tags.length > 0) {
      const allowedTags =
        reviewerType === ReviewUserType.Customer
          ? CUSTOMER_TO_DRIVER_TAGS
          : DRIVER_TO_CUSTOMER_TAGS;

      const invalidTags = dto.tags.filter((tag) => !allowedTags.includes(tag));
      if (invalidTags.length > 0) {
        throw new BadRequestException(`Invalid tags: ${invalidTags.join(', ')}`);
      }
    }

    const review = await this._prisma.$transaction(async (tx) => {
      const newReview = await tx.lead_review.create({
        data: {
          lead_order_id: dto.leadOrderId,
          reviewer_type: reviewerType,
          reviewer_id: userId,
          reviewee_type: revieweeType,
          reviewee_id: revieweeId,
          rating: dto.rating,
          title: dto.title,
          comment: dto.comment,
          tags: dto.tags ?? undefined,
          is_anonymous: dto.is_anonymous ?? false,
        },
      });

      if (revieweeType === ReviewUserType.Driver) {
        const driver = await tx.driver.findUnique({
          where: { id: revieweeId },
          select: { average_rating: true, total_reviews: true },
        });

        if (driver) {
          const newTotal = driver.total_reviews + 1;
          const newAverage = parseFloat(
            ((driver.average_rating * driver.total_reviews + dto.rating) / newTotal).toFixed(2),
          );

          await tx.driver.update({
            where: { id: revieweeId },
            data: {
              average_rating: newAverage,
              total_reviews: newTotal,
            },
          });
        }
      } else {
        const customer = await tx.customer.findUnique({
          where: { id: revieweeId },
          select: { average_rating: true, total_reviews: true },
        });

        if (customer) {
          const newTotal = customer.total_reviews + 1;
          const newAverage = parseFloat(
            ((customer.average_rating * customer.total_reviews + dto.rating) / newTotal).toFixed(2),
          );

          await tx.customer.update({
            where: { id: revieweeId },
            data: {
              average_rating: newAverage,
              total_reviews: newTotal,
            },
          });
        }
      }

      return newReview;
    });

    return {
      id: review.id,
      reviewerType: review.reviewer_type,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      tags: review.tags as string[] | null,
      is_anonymous: review.is_anonymous,
      created_at: review.created_at,
    };
  }

  /**
   * Returns whether the customer and driver have submitted reviews for a given lead order.
   */
  async getReviewStatusAsync(leadOrderId: number): Promise<ReviewStatusDto> {
    const order = await this._prisma.lead_order.findUnique({
      where: { id: leadOrderId },
      select: { id: true, customer_id: true, driver_id: true, status: true },
    });

    if (!order) {
      throw new NotFoundException(`Lead order with ID ${leadOrderId} not found`);
    }

    const reviews = await this._prisma.lead_review.findMany({
      where: { lead_order_id: leadOrderId },
      select: { reviewer_type: true },
    });

    const customerReviewed = reviews.some((r) => r.reviewer_type === ReviewUserType.Customer);
    const driverReviewed = reviews.some((r) => r.reviewer_type === ReviewUserType.Driver);

    return { customerReviewed, driverReviewed };
  }
}
