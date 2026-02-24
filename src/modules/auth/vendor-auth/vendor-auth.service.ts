import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { VendorAuthRequestDto } from './dto/vendor-auth-request.dto';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { SmsService } from 'src/services/sms/sms.service';
import { MailService } from 'src/services/mail/mail.service';
import { Utility } from 'src/shared/helper/utility';
import { OtpType } from 'generated/prisma/enums';
import { TemplateHelper } from 'src/shared/helper/template-helper';
import { ResponseDto } from 'src/core/response/dto/response.dto';

@Injectable()
export class VendorAuthService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _smsService: SmsService,
    private readonly _emailService: MailService,
  ) {}

  /**
   * Verifies the vendor's credentials and sends OTPs to their registered number and email.
   * @param request The vendor authentication request containing the number and email.
   * @returns A response indicating the success or failure of the OTP sending process.
   */
  async verifyAndSendOtpAsync(
    request: VendorAuthRequestDto,
  ): Promise<ResponseDto<null>> {
    const vendor = await this._prismaService.vendor.findFirst({
      where: {
        number: request.number,
        email: request.email,
        is_deleted: false,
      },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor not found');
    }

    const numberOtp = Utility.generateOtp(6);
    const emailOtp = Utility.generateOtp(6);

    const expiredAt = new Date(Date.now() + 5 * 60 * 1000);

    const result = await this._prismaService.otp.createMany({
      data: [
        {
          otp: numberOtp.toString(),
          number: vendor.number,
          type: OtpType.Number,
          expires_at: expiredAt,
        },
        {
          otp: emailOtp.toString(),
          email: vendor.email,
          type: OtpType.Email,
          expires_at: expiredAt,
        },
      ],
    });

    if (result.count !== 2) {
      throw new BadRequestException('Failed to create OTPs');
    }

    const template = TemplateHelper.replaceVariables(
      TemplateHelper.getTemplate('otp'),
      {
        APP_NAME: 'Towchen Service',
        OTP: emailOtp,
        EXPIRY_MINUTES: 5,
        SUPPORT_EMAIL: 'support@towchen.com',
      },
    );

    const [smsResponse, emailResponse] = await Promise.all([
      this._smsService.sendSmsAsync({
        to: `+91${vendor.number}`,
        message: `Your OTP is ${numberOtp}`,
      }),
      this._emailService.sendMailAsync({
        to: vendor.email,
        subject: 'OTP verification',
        text: 'OTP verification email',
        html: template,
      }),
    ]);

    if (!smsResponse?.success || !emailResponse?.success) {
      throw new BadRequestException('Failed to send OTPs');
    }

    return new ResponseDto<null>(
      true,
      HttpStatus.OK,
      'OTPs sent successfully',
      null,
    );
  }
}
