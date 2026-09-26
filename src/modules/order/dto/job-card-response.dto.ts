import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhysicalVcrfResponseDto {
  @ApiProperty({ description: 'Uploaded physical VCRF image URL', example: 'https://storage.towchen.com/vcrf/pickup.jpg' })
  url: string;

  @ApiProperty({ description: 'Filled in method', example: 'vcrf' })
  filled_in: string;

  @ApiProperty({ description: 'Job card type', example: 'VCRF', enum: ['VCRF', 'EVCRF'] })
  job_card_type: string;
}

export class EvcrfSubmissionResponseDto {
  @ApiPropertyOptional({ description: 'Submission ID', example: 1 })
  id?: number;

  @ApiProperty({ description: 'Filled in method', example: 'evcrf' })
  filled_in: string;

  @ApiProperty({ description: 'Job card type', example: 'EVCRF', enum: ['VCRF', 'EVCRF'] })
  job_card_type: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({ description: 'Verification message', example: 'OTP verified successfully.' })
  message: string;

  @ApiPropertyOptional({ description: 'Job card type determined from pickup (if completed)', example: 'VCRF', nullable: true })
  job_card_type?: string | null;

  @ApiPropertyOptional({ description: 'Job card type used at pickup', example: 'VCRF', nullable: true })
  pickup_job_card_type?: string | null;
}
