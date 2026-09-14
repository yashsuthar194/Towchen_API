import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CustomerSubscriptionService } from './customer-subscription.service';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { CustomerGuard } from 'src/services/jwt/guards/customer.guard';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { CallerService } from 'src/services/jwt/caller.service';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { CustomerVehicleWithPlansDto } from './dto/customer-vehicle-plan.dto';
import { CustomerSubscriptionPurchaseResultDto } from './dto/customer-subscription-purchase-result.dto';

@ApiTags('Customer Subscription')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, CustomerGuard)
@Controller('customer-subscription')
export class CustomerSubscriptionController {
  constructor(
    private readonly customerSubscriptionService: CustomerSubscriptionService,
    private readonly callerService: CallerService,
  ) {}

  @Get('vehicles-and-plans')
  @ApiOperation({
    summary:
      'Get all customer vehicles with their active subscriptions and available plans',
  })
  @ApiResponseDto(CustomerVehicleWithPlansDto, true)
  async getVehiclesAndPlans() {
    const customerId = this.callerService.getUserId();
    const data =
      await this.customerSubscriptionService.getVehiclesAndPlans(customerId);
    return new ResponseDto(
      true,
      200,
      'Vehicles and plans fetched successfully',
      data,
    );
  }

  @Post('purchase')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Purchase subscriptions for multiple vehicles at once',
  })
  @ApiResponseDto(CustomerSubscriptionPurchaseResultDto)
  @UseInterceptors(FilesInterceptor('rc_books', 10))
  async purchaseSubscription(
    @Body() dto: PurchaseSubscriptionDto,
    @UploadedFiles() rcBooks: Express.Multer.File[],
  ) {
    const customerId = this.callerService.getUserId();
    const data = await this.customerSubscriptionService.purchaseSubscription(
      customerId,
      dto,
      rcBooks,
    );
    return new ResponseDto(
      true,
      200,
      'Subscription purchased successfully',
      data,
    );
  }
}
