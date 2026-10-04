import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConsentActionDto {
  @ApiPropertyOptional({
    description: 'Optional comments or notes provided by the actor during this step',
    example: 'Reviewed order log and confirmed invoice matches agreed discount rate.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  remarks?: string;
}

export class ConsentRejectDto {
  @ApiProperty({
    description: 'Mandatory reason for rejecting this consent step',
    example: 'The proposed final amount does not tally with the revised mileage calculation.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
