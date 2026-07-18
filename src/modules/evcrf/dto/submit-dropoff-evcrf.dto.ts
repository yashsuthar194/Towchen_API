import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform, plainToInstance } from 'class-transformer';

export class EVCRFDynamicFieldDto {
  @IsString()
  Label: string;

  @IsString()
  Value: string;
}

export class SubmitDropoffEvcrfDto {
  @ApiProperty({ description: "Handover's Name", example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  handover_name: string;

  @ApiProperty({ description: 'Drop Location', example: 'Workshop ABC' })
  @IsNotEmpty()
  @IsString()
  drop_location: string;

  @ApiProperty({ description: 'Droping Type', example: 'Authorized Workshop' })
  @IsNotEmpty()
  @IsString()
  droping_type: string;

  @ApiProperty({ description: 'Dropping (date & time)', example: '21/02/2025' })
  @IsNotEmpty()
  @IsString()
  dropping_date_and_time: string;

  @ApiProperty({ description: 'Remarks/comments', example: 'Delivered successfully.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Handover Image (File)' })
  handover_image: any;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Handover Signature (File)' })
  handover_signature: any;


  @ApiProperty({
    description: 'JSON array of dynamic fields',
    type: 'string',
    example: '[{"Label": "Custom Field", "Value": "Custom Value"}]'
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        if(value == '{}') return []
        const parsed = JSON.parse(value);
        if (parsed && Array.isArray(parsed)) return plainToInstance(EVCRFDynamicFieldDto, parsed);
      } catch (e) {
        return []
      }
    }
    return value ?? [];
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EVCRFDynamicFieldDto)
  dynamic_fields?: EVCRFDynamicFieldDto[];
}
