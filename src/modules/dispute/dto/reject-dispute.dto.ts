import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectDisputeDto {
  @ApiProperty({
    description: 'Mandatory reason for rejecting / terminating the dispute request',
    example: 'Invalid or illegible receipt uploaded; route does not include any toll plaza.',
  })
  @IsNotEmpty()
  @IsString()
  remarks: string;
}
