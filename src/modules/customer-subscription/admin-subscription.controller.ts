import { Controller, Get, UseGuards } from '@nestjs/common';
import { CustomerSubscriptionService } from './customer-subscription.service';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { AdminGuard } from 'src/services/jwt/guards/admin.guard';
import { JwtAuthGuard } from 'src/services/jwt/guards/jwt-auth.guard';
import { ApiResponseDto } from 'src/core/response/decorators/api-response-dto.decorator';
import { PendingManualActivationSubscriptionDto } from './dto/pending-manual-activation-subscription.dto';

@ApiTags('Admin Subscription')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/subscription')
export class AdminSubscriptionController {
  constructor(
    private readonly customerSubscriptionService: CustomerSubscriptionService,
  ) {}

  @Get('pending-manual-activation')
  @ApiOperation({
    summary:
      'Get subscriptions that missed automatic cron activation and need manual review',
  })
  @ApiResponseDto(PendingManualActivationSubscriptionDto, true)
  async getPendingManualActivation() {
    const data =
      await this.customerSubscriptionService.getPendingManualActivation();
    return new ResponseDto(
      true,
      200,
      'Pending manual activation subscriptions fetched successfully',
      data,
    );
  }
}
