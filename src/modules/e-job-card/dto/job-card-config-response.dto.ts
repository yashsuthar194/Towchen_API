import { ApiProperty } from '@nestjs/swagger';

export class JobCardConfigResponseDto {
  @ApiProperty({ description: 'The mapped vehicle class', example: 'Car' })
  mapped_class: string;

  @ApiProperty({ description: 'Diagram image URL' })
  diagram_image_url: string;

  @ApiProperty({ description: 'Total damage points', example: 25 })
  total_damage_points: number;

  @ApiProperty({ description: 'List of accessories' })
  accessories: any[];

  @ApiProperty({ description: 'List of condition groups (Day/Night, Wet/Dry, etc)' })
  condition_groups: any[];

  @ApiProperty({ description: 'Order Creation Date & Time' })
  date_time: string;

  @ApiProperty({ description: 'Order ID (formatted)', example: 'ORD-12345' })
  order_id: string;

  @ApiProperty({ description: 'Service Type Name', example: 'Flatbed Towing' })
  service_type: string;

  @ApiProperty({ description: 'Vehicle Brand', example: 'Toyota' })
  vehicle_brand: string;

  @ApiProperty({ description: 'Vehicle Model', example: 'Camry' })
  vehicle_model: string;

  @ApiProperty({ description: 'Vehicle Registration No.', example: 'GJ01AB1234' })
  vehicle_no: string;

  @ApiProperty({ description: 'Customer Phone No.' })
  customer_ph_no: string;

  @ApiProperty({ description: 'Assigned Driver Name' })
  driver_name: string;

  @ApiProperty({ description: 'Assigned Driver Phone No.' })
  driver_ph_no: string;

  @ApiProperty({ description: 'Driver Reaching Date & Time (Start Time)', nullable: true })
  reaching_date_time: string | null;

  @ApiProperty({ description: 'Event Type (Static Breakdown)', example: 'Breakdown' })
  event_type: string;

  @ApiProperty({ description: 'Event Location (Breakdown Address)' })
  event_location: string;
}
