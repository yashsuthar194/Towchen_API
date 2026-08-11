import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType, VendorStatus, VehicleStatus, AvailabilityStatus } from '@prisma/client';
import { ServiceDto } from './service.dto';
import { VendorBankDetailDto } from '../../vendor-bank-detail/dto/vendor-bank-detail.dto';
import { VehicleDetailDto } from '../../vehicle/dto/vehicle-detail.dto';

/**
 * Slim driver summary embedded in the vehicle summary.
 */
export class VendorVehicleDriverSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ramesh Kumar' })
  driver_name: string;

  @ApiProperty({ example: '9876543210' })
  mobile_number: string;
}

/**
 * Slim vehicle summary embedded inside the vendor detail response.
 */
export class VendorVehicleSummaryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'MH12AB1234' })
  registration_number: string;

  @ApiProperty({ example: 'Toyota' })
  make: string;

  @ApiProperty({ example: 'Camry' })
  model: string;

  @ApiProperty({ example: 'Sedan', nullable: true })
  vehicle_class: string | null;

  /** Raw sub-service ID stored on the vehicle record. */
  @ApiProperty({ example: 3 })
  fleet_type: number;

  /** Human-readable name resolved from the sub_service table. */
  @ApiProperty({ example: 'Underlift', nullable: true })
  fleet_type_name: string | null;

  /** Physical location / garage where the fleet is stationed. */
  @ApiProperty({ example: 'Mumbai Central Depot' })
  fleet_location: string;

  @ApiProperty({ enum: VehicleStatus })
  status: VehicleStatus;

  @ApiProperty({ enum: AvailabilityStatus })
  availability_status: AvailabilityStatus;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  vehicle_validity: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  insurance_validity: Date;

  @ApiProperty({ type: [String], example: ['https://storage.example.com/vehicle.jpg'] })
  vehical_image_url: string[];

  /** The driver currently assigned to this vehicle, or null if unassigned. */
  @ApiProperty({ type: VendorVehicleDriverSummaryDto, nullable: true })
  driver: VendorVehicleDriverSummaryDto | null;
}

/**
 * Response DTO for vendor detail endpoints.
 *
 * Extends the base profile with aggregated stats:
 * - driver_count, completed_orders_count, running_orders_count
 * - vendor_rating (average of drivers' average_rating)
 * - fleet_count and vehicles list
 */
export class VendorDetailDto {
  id: number;

  @ApiProperty({ example: 'VEND00000001' })
  formated_id: string;

  vendor_name: string;
  email: string;
  mobile_number: string;
  alternate_number: string;
  is_email_verified: boolean;
  vendor_profile_image_url: string;

  pan_card_url: string;
  aadhar_card_url: string;

  @ApiProperty({ example: 'Acme Logistics Pvt. Ltd.' })
  organization_name: string;

  organization_certificate_url: string;

  @ApiProperty({
    enum: Object.values(OrganizationType),
    example: OrganizationType.SoleProprietorship,
  })
  organization_type: OrganizationType;

  gst_number: string | null;
  gst_certificate_url: string;

  /** Whether the vendor is GST-registered. Derived from gst_number. */
  @ApiProperty({ type: Boolean, example: true })
  is_gst_vendor: boolean;

  approved_by: number | null;
  created_at: Date;
  updated_at: Date;

  @ApiProperty({
    type: ServiceDto,
    isArray: true,
  })
  services: ServiceDto[];

  @ApiProperty({
    enum: Object.values(VendorStatus),
    example: VendorStatus.Pending,
  })
  status: VendorStatus;

  signature_url: string | null;

  bank_detail: VendorBankDetailDto | null;

  // ─── Aggregated Stats ────────────────────────────────────────────────

  /** Total number of active (non-deleted) drivers under this vendor. */
  @ApiProperty({ example: 12 })
  driver_count: number;

  /** Number of orders that have reached Completed or Closed status. */
  @ApiProperty({ example: 230 })
  completed_orders_count: number;

  /** Number of orders currently in-progress (Assigned | OtpPending | InProgress). */
  @ApiProperty({ example: 3 })
  running_orders_count: number;

  /**
   * Vendor rating derived as the mean of all active drivers' `average_rating`.
   * Returns 0 when the vendor has no rated drivers.
   */
  @ApiProperty({ example: 4.2 })
  vendor_rating: number;

  /** Number of active (non-deleted) vehicles (fleet) under this vendor. */
  @ApiProperty({ example: 8 })
  fleet_count: number;

  /** Total orders ever associated with this vendor (running + completed + all other statuses). */
  @ApiProperty({ example: 310 })
  total_orders: number;

  /** List of active vehicles belonging to this vendor. */
  @ApiProperty({ type: [VendorVehicleSummaryDto] })
  vehicles: VendorVehicleSummaryDto[];
}
