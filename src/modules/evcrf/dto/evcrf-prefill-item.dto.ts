import { ApiProperty } from '@nestjs/swagger';

export class EvcrfPrefillItemDto {
  @ApiProperty({ description: 'Label for the prefill detail', example: 'Date & Time' })
  Label: string;

  @ApiProperty({ description: 'Value for the prefill detail', example: '2023-10-25T10:00:00.000Z' })
  Value: string | null;
}
