import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class QueryRunnerDto {
  @ApiProperty({
    description: 'Raw SQL query string to execute',
    example: 'SELECT * FROM "admin" LIMIT 10;',
  })
  @IsNotEmpty()
  @IsString()
  query: string;
}
