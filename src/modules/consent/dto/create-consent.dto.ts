import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConsentEntityType, ConsentType } from '@prisma/client';

export class CreateConsentDto {
  @ApiProperty({
    enum: ConsentEntityType,
    description: 'Target parent entity domain (Order, Vendor, Driver, Vehicle, Subscription, ManualPackage, ServiceLocation)',
    example: ConsentEntityType.Order,
  })
  @IsEnum(ConsentEntityType)
  @IsNotEmpty()
  entity_type: ConsentEntityType;

  @ApiPropertyOptional({
    description: 'Numeric primary key ID of the target record. Omit or leave null for new entity registration requests.',
    example: 42,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  entity_id?: number;

  @ApiProperty({
    enum: ConsentType,
    description: 'The specific consent type being requested',
    example: ConsentType.OrderEdit,
  })
  @IsEnum(ConsentType)
  @IsNotEmpty()
  consent_type: ConsentType;

  @ApiProperty({
    description: 'Brief title or summary of this consent request',
    example: 'Apply 15% VIP discount and update dropoff remarks',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed explanation or business justification',
    example: 'Customer experienced service delay. Agreed to compensation discount.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'Proposed field changes or payload to execute once permission is granted at Step 4',
    example: { discount_amount: 150.0, final_amount: 1850.0 },
  })
  @IsObject()
  @IsNotEmpty()
  proposed_payload: Record<string, any>;
}
