import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CarSegment,
  DealerPackageStatus,
  FuelType,
  PackagePaymentStatus,
  TransmissionType,
} from '@prisma/client';

export class DealerCustomerResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Rahul Sharma' })
  customer_name: string;

  @ApiProperty({ example: '+919876543210' })
  customer_number: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  alternative_number?: string | null;

  @ApiProperty({ example: 'rahul.sharma@example.com' })
  email_address: string;

  @ApiPropertyOptional({ example: 'Flat 402' })
  building?: string | null;

  @ApiPropertyOptional({ example: 'Wing B' })
  block?: string | null;

  @ApiPropertyOptional({ example: 'MG Road' })
  road?: string | null;

  @ApiProperty({ example: 'Mumbai' })
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  state: string;

  @ApiProperty({ example: '400001' })
  pincode: string;

  @ApiPropertyOptional({ example: '27AAAAA0000A1Z5' })
  gst_number?: string | null;
}

export class DealerCustomerVehicleResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'MH02AB1234' })
  vehicle_reg_number: string;

  @ApiProperty({ example: 'Maruti Suzuki' })
  vehicle_make: string;

  @ApiProperty({ example: 'Dzire' })
  vehicle_model: string;

  @ApiProperty({ enum: FuelType, example: FuelType.Petrol })
  vehicle_fuel_type: FuelType;

  @ApiProperty({ enum: TransmissionType, example: TransmissionType.Manual })
  transmission_type: TransmissionType;

  @ApiProperty({ example: 2022 })
  registration_year: number;

  @ApiProperty({ example: 'MA3EAA12S00123456' })
  chassis_number: string;

  @ApiProperty({ example: 34500 })
  current_odometer_reading: number;

  @ApiProperty({ enum: CarSegment, example: CarSegment.Basic })
  car_segment: CarSegment;

  @ApiProperty({ example: 'https://storage.example.com/front.jpg' })
  image_front: string;

  @ApiProperty({ example: 'https://storage.example.com/rear.jpg' })
  image_rear: string;

  @ApiProperty({ example: 'https://storage.example.com/left.jpg' })
  image_left: string;

  @ApiProperty({ example: 'https://storage.example.com/right.jpg' })
  image_right: string;

  @ApiPropertyOptional({ example: { latitude: 19.076, longitude: 72.877, captured_at: '2026-10-04' } })
  vehicle_images_meta?: any;

  @ApiProperty({ example: 'https://storage.example.com/odo.jpg' })
  odometer_image: string;

  @ApiPropertyOptional({ example: { latitude: 19.076, longitude: 72.877, captured_at: '2026-10-04' } })
  odometer_image_meta?: any;
}

export class DealerPackageOrderResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'DPKG0000001' })
  order_number: string;

  @ApiProperty({ example: 1 })
  dealer_id: number;

  @ApiProperty({ example: 1 })
  dealer_customer_id: number;

  @ApiProperty({ example: 1 })
  vehicle_id: number;

  @ApiProperty({ example: 1 })
  package_plan_id: number;

  @ApiProperty({ example: 'Gold Mobility Shield' })
  plan_name: string;

  @ApiProperty({ enum: CarSegment, example: CarSegment.Basic })
  car_segment: CarSegment;

  @ApiProperty({ example: 1999.0 })
  amount: number;

  @ApiProperty({ example: 12 })
  plan_period_months: number;

  @ApiProperty({ example: 4 })
  incidents_allowed: number;

  @ApiProperty({ example: 0 })
  incidents_used: number;

  @ApiProperty({ example: 50.0 })
  distance_km_allowed: number;

  @ApiProperty({ example: 2 })
  hotel_accommodation_allowed: number;

  @ApiProperty({ example: 0 })
  hotel_accommodation_used: number;

  @ApiProperty({ example: 2 })
  cab_service_allowed: number;

  @ApiProperty({ example: 0 })
  cab_service_used: number;

  @ApiPropertyOptional({ example: 'Sample admin note' })
  admin_notes?: string | null;

  @ApiProperty({ example: '2026-10-04T00:00:00.000Z' })
  start_date: Date;

  @ApiProperty({ example: '2027-10-04T00:00:00.000Z' })
  expiry_date: Date;

  @ApiProperty({ enum: DealerPackageStatus, example: DealerPackageStatus.Active })
  status: DealerPackageStatus;

  @ApiProperty({ enum: PackagePaymentStatus, example: PackagePaymentStatus.PendingInternalSettlement })
  payment_status: PackagePaymentStatus;

  @ApiPropertyOptional({ example: 'https://storage.example.com/certificate.pdf' })
  package_pdf_url?: string | null;

  @ApiProperty({ example: '2026-10-04T12:00:00.000Z' })
  created_at: Date;

  @ApiPropertyOptional({ type: DealerCustomerResponseDto })
  customer?: DealerCustomerResponseDto;

  @ApiPropertyOptional({ type: DealerCustomerVehicleResponseDto })
  vehicle?: DealerCustomerVehicleResponseDto;
}

export class DealerPackageOrderListResponseDto {
  @ApiProperty({ type: [DealerPackageOrderResponseDto] })
  items: DealerPackageOrderResponseDto[];

  @ApiProperty({
    example: { page: 1, limit: 10, total: 1, total_pages: 1 },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
