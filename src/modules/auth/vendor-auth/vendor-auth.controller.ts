import { Body, Controller, Post } from '@nestjs/common';
import { VendorAuthRequestDto } from './dto/vendor-auth-request.dto';
import { ResponseDto } from 'src/core/response/dto/response.dto';
import { VendorAuthService } from './vendor-auth.service';

@Controller('vendor-auth')
export class VendorAuthController {
  constructor(private readonly _vendorAuthService: VendorAuthService) {}

  @Post('login')
  async verifyAndSendOtpAsync(
    @Body() request: VendorAuthRequestDto,
  ): Promise<ResponseDto<null>> {
    return this._vendorAuthService.verifyAndSendOtpAsync(request);
  }
}
