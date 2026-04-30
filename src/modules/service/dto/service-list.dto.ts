import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceListDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ required: false, nullable: true })
  description?: string | null;
}
