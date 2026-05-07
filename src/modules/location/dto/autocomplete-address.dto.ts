import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AutocompleteAddressDto {
  @ApiProperty({
    description: 'The user input text to search for',
    example: 'Gandhinagar',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  input: string;
}
