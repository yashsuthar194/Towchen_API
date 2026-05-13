import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerVehicleDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Toyota' })
  make: string;

  @ApiProperty({ example: 'Camry' })
  model: string;

  @ApiProperty({ example: 'ABC-1234' })
  registration_number: string;

  @ApiProperty({ example: 'Sedan' })
  class: string;

  @ApiProperty({ example: 'Petrol' })
  fuel_type: string;
}

export class CustomerDetailDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'CUST-001' })
  formated_id: string;

  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: '9876543210' })
  number: string;

  @ApiProperty({ example: true })
  is_verified: boolean;

  @ApiProperty({ type: [CustomerVehicleDetailDto] })
  customer_vehicles: CustomerVehicleDetailDto[];
}
