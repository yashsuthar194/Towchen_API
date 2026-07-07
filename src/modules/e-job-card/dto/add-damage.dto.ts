import { IsNotEmpty, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddDamageDto {
  @ApiProperty({ description: 'Damage point number from the vehicle diagram', example: 1 })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNotEmpty()
  @IsInt()
  damage_number: number;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Damage Image (File)' })
  damage_image: any;
}
