import { Module } from '@nestjs/common';
import { ReviewController, ReviewListController } from './review.controller';
import { ReviewService } from './review.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewController, ReviewListController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
