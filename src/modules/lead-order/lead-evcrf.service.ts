import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { VehicleClassMappingService } from '../vehicle-class-mapping/vehicle-class-mapping.service';
import { SubmitPickupLeadEvcrfDto } from './dto/submit-pickup-lead-evcrf.dto';
import { AddDamageDto } from '../evcrf/dto/add-damage.dto';
import { StorageService } from 'src/services/storage/storage.service';
import { LocationType } from '@prisma/client';
import { EvcrfPrefillResponseDto } from '../evcrf/dto/evcrf-prefill-response.dto';

@Injectable()
export class LeadEvcrfService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _mappingService: VehicleClassMappingService,
    private readonly _storageService: StorageService,
  ) {}

  async submitPickupEvcrfAsync(
    leadOrderId: number, 
    driverId: number, 
    dto: SubmitPickupLeadEvcrfDto,
    files: {
      odometer_image?: Express.Multer.File[];
      driver_image?: Express.Multer.File[];
      driver_sign?: Express.Multer.File[];
    }
  ) {
    const leadOrder = await this._prisma.lead_order.findUnique({
      where: { id: leadOrderId },
      include: { 
        vehicle: true,
        customer: true,
        driver: true,
        sub_service: true,
        locations: { where: { type: LocationType.Breakdown } }
      },
    });

    if (!leadOrder) {
      throw new NotFoundException(`Lead Order with ID ${leadOrderId} not found`);
    }

    if (leadOrder.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this leadOrder');
    }

    // Physical flag will be updated to false on successful EVCRF submission

    // Check configuration exists
    const config = await this._prisma.vehicle_class_configuration.findUnique({
      where: { id: dto.vehicle_class_configuration_id }
    });
    if (!config) {
      throw new BadRequestException('Invalid vehicle_class_configuration_id');
    }

    // Upload images (only if provided)
    const folder = `lead-evcrf/\/pickup`;

    const odometerUpload = files.odometer_image?.[0]
      ? await this._storageService.uploadFileAsync({
          buffer: files.odometer_image[0].buffer,
          originalName: files.odometer_image[0].originalname,
          mimeType: files.odometer_image[0].mimetype,
          size: files.odometer_image[0].size,
          folderPath: folder,
        })
      : null;

    const driverUpload = files.driver_image?.[0]
      ? await this._storageService.uploadFileAsync({
          buffer: files.driver_image[0].buffer,
          originalName: files.driver_image[0].originalname,
          mimeType: files.driver_image[0].mimetype,
          size: files.driver_image[0].size,
          folderPath: folder,
        })
      : null;

    const signUpload = files.driver_sign?.[0]
      ? await this._storageService.uploadFileAsync({
          buffer: files.driver_sign[0].buffer,
          originalName: files.driver_sign[0].originalname,
          mimeType: files.driver_sign[0].mimetype,
          size: files.driver_sign[0].size,
          folderPath: folder,
        })
      : null;

    return await this._prisma.$transaction(async (tx) => {
      const breakdownLocation = leadOrder.locations[0]?.address || leadOrder.locations[0]?.city || '-';
      const autoDateAndTime = leadOrder.created_at.toISOString();
      const autoServiceType = leadOrder.sub_service?.name || '-';
      const autoVehicleBrand = leadOrder.vehicle?.make || '-';
      const autoVehicleModel = leadOrder.vehicle?.model || '-';
      const autoVehicleNo = leadOrder.vehicle?.registration_number || '-';
      const autoCustomerPhNo = leadOrder.customer?.number || '-';
      const autoDriverName = leadOrder.driver?.driver_name || '-';
      const autoDriverPhNo = leadOrder.driver?.mobile_number || '-';
      const autoReachingDateAndTime = leadOrder.start_time ? leadOrder.start_time.toISOString() : '-';
      const autoEventType = 'Breakdown';
      const autoEventLocation = breakdownLocation;

      const metaPayload = {
        ...dto,
        vehicle_class_configuration_name: config.mapped_class,
        ...(odometerUpload && { odometer_image_url: odometerUpload.url }),
        ...(driverUpload && { driver_image_url: driverUpload.url }),
        ...(signUpload && { driver_sign_url: signUpload.url }),
      };

      // Remove undefined/null values so the JSON is clean
      const cleanMetaPayload = Object.fromEntries(
        Object.entries(metaPayload).filter(([_, v]) => v != null)
      );

      const dataFields: Record<string, any> = {
        fuel_amount: dto.fuel_amount,
        odometer_reading_text: dto.odometer_reading_text,
        vehicle_class_configuration_id: dto.vehicle_class_configuration_id,
        remarks: dto.remarks,
        selected_accessories: dto.selected_accessories ? (dto.selected_accessories as any) : undefined,
        date_and_time: autoDateAndTime,
        service_type: autoServiceType,
        vehicle_brand: autoVehicleBrand,
        vehicle_model: autoVehicleModel,
        vehicle_no: autoVehicleNo,
        customer_ph_no: autoCustomerPhNo,
        driver_name: autoDriverName,
        driver_ph_no: autoDriverPhNo,
        reaching_date_and_time: autoReachingDateAndTime,
        event_type: autoEventType,
        event_location: autoEventLocation,
        vehicle_state: dto.vehicle_state ? (dto.vehicle_state as any) : undefined,
        meta: Object.keys(cleanMetaPayload).length > 0 ? cleanMetaPayload : undefined,
      };

      // Only set image fields when files are provided
      if (odometerUpload) dataFields.odometer_image = odometerUpload.url;
      if (driverUpload) dataFields.driver_image = driverUpload.url;
      if (signUpload) dataFields.driver_sign = signUpload.url;

      // Upsert: create if not exists, update if exists — single DB round-trip
      const evcrf = await tx.lead_pickup_evcrf.upsert({
        where: { lead_order_id: leadOrderId },
        create: {
          lead_order_id: leadOrderId,
          ...dataFields,
        },
        update: dataFields,
        include: { damages: true },
      });

      // Update leadOrder physical VCRF flag to false
      await tx.lead_order.update({
        where: { id: leadOrderId },
        data: {
          is_physical_vcrf_for_pickup: false,
        },
      });

      return evcrf;
    });
  }

  async submitDropoffEvcrfAsync(
    leadOrderId: number, 
    driverId: number, 
    dto: import('./dto/submit-dropoff-lead-evcrf.dto').SubmitDropoffLeadEvcrfDto,
    files: {
      handover_image?: Express.Multer.File[];
      handover_signature?: Express.Multer.File[];
    }
  ) {
    const leadOrder = await this._prisma.lead_order.findUnique({
      where: { id: leadOrderId },
    });

    if (!leadOrder) {
      throw new NotFoundException(`Lead Order with ID ${leadOrderId} not found`);
    }

    if (leadOrder.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this leadOrder');
    }

    if (!files.handover_image?.[0]) throw new BadRequestException('handover_image file is required');
    if (!files.handover_signature?.[0]) throw new BadRequestException('handover_signature file is required');

    const folder = `lead-evcrf/\/dropoff`;

    const [imageUpload, signUpload] = await Promise.all([
      this._storageService.uploadFileAsync({
        buffer: files.handover_image[0].buffer,
        originalName: files.handover_image[0].originalname,
        mimeType: files.handover_image[0].mimetype,
        size: files.handover_image[0].size,
        folderPath: folder,
      }),
      this._storageService.uploadFileAsync({
        buffer: files.handover_signature[0].buffer,
        originalName: files.handover_signature[0].originalname,
        mimeType: files.handover_signature[0].mimetype,
        size: files.handover_signature[0].size,
        folderPath: folder,
      }),
    ]);

    return await this._prisma.$transaction(async (tx) => {
      const existing = await tx.lead_dropoff_evcrf.findUnique({
        where: {
          lead_order_id: leadOrderId,
        },
      });

      if (existing) {
        await tx.lead_dropoff_evcrf.delete({
          where: { id: existing.id },
        });
      }

      const metaPayload = {
        ...dto,
        handover_image_url: imageUpload.url,
        handover_signature_url: signUpload.url,
      };

      const cleanMetaPayload = Object.fromEntries(
        Object.entries(metaPayload).filter(([_, v]) => v != null)
      );

      const evcrf = await tx.lead_dropoff_evcrf.create({
        data: {
          lead_order_id: leadOrderId,
          remarks: dto.remarks,
          handover_name: dto.handover_name,
          drop_location: dto.drop_location,
          droping_type: dto.droping_type,
          dropping_date_and_time: dto.dropping_date_and_time,
          handover_image: imageUpload.url,
          handover_signature: signUpload.url,
          dynamic_fields: dto.dynamic_fields ? (dto.dynamic_fields as any) : undefined,
          meta: Object.keys(cleanMetaPayload).length > 0 ? cleanMetaPayload : undefined,
        },
      });

      await tx.lead_order.update({
        where: { id: leadOrderId },
        data: {
          is_physical_vcrf_for_dropoff: false,
        },
      });

      return await tx.lead_dropoff_evcrf.findUnique({
        where: { id: evcrf.id },
      });
    });
  }

  async getPickupEvcrfAsync(leadOrderId: number) {
    const evcrf = await this._prisma.lead_pickup_evcrf.findUnique({
      where: {
        lead_order_id: leadOrderId,
      },
      include: { damages: true },
    });

    if (!evcrf) {
      throw new NotFoundException(`Pickup E-EVCRF for Order ${leadOrderId} not found`);
    }

    return evcrf;
  }

  async getDropoffEvcrfAsync(leadOrderId: number) {
    const evcrf = await this._prisma.lead_dropoff_evcrf.findUnique({
      where: {
        lead_order_id: leadOrderId,
      },
    });

    if (!evcrf) {
      throw new NotFoundException(`Dropoff E-EVCRF for Order ${leadOrderId} not found`);
    }

    const dynamic_fields = [
      { Label: "Handover's Name", Value: evcrf.handover_name || '-' },
      { Label: 'Drop Location', Value: evcrf.drop_location || '-' },
      { Label: 'Droping Type', Value: evcrf.droping_type || '-' },
      { Label: 'Dropping (date & time)', Value: evcrf.dropping_date_and_time || '-' },
      { Label: 'Remarks/comments', Value: evcrf.remarks || '-' }
    ];

    if (evcrf.dynamic_fields && Array.isArray(evcrf.dynamic_fields)) {
      dynamic_fields.push(...evcrf.dynamic_fields as any[]);
    }

    return {
      ...evcrf,
      dynamic_fields
    };
  }

  async getEvcrfConfigurationAsync(leadOrderId: number) {
    const leadOrder = await this._prisma.lead_order.findUnique({
      where: { id: leadOrderId },
      include: { 
        vehicle: true,
        customer: true,
        driver: true,
        sub_service: true,
        locations: { where: { type: LocationType.Breakdown } }
      },
    });

    if (!leadOrder) {
      throw new NotFoundException(`Lead Order with ID ${leadOrderId} not found`);
    }

    const rawClass = leadOrder.vehicle?.vehicle_class;
    const resolvedClass = await this._mappingService.resolveMappedClass(rawClass);

    const config = await this._prisma.vehicle_class_configuration.findUnique({
      where: { mapped_class: resolvedClass },
      include: { 
        accessories: true,
        vehicle_states: { include: { options: true } }
      },
    });

    const breakdownLocation = leadOrder.locations[0]?.address || leadOrder.locations[0]?.city || '-';

    return {
      // Configuration data
      mapped_class: config?.mapped_class || resolvedClass,
      diagram_image_url: config?.diagram_image_url || '',
      total_damage_points: config?.total_damage_points || 0,
      accessories: config?.accessories || [],
      vehicle_state: config?.vehicle_states || [],

      // Order pre-fill data array
      prefill_details: this.mapEvcrfFilledDetailsArray({
        date_time: leadOrder.created_at.toISOString(),
        lead_order_id: leadOrder.formated_id,
        service_type: leadOrder.sub_service?.name || '-',
        vehicle_brand: leadOrder.vehicle?.make || '-',
        vehicle_model: leadOrder.vehicle?.model || '-',
        vehicle_no: leadOrder.vehicle?.registration_number || '-',
        customer_ph_no: leadOrder.customer?.number || '-',
        driver_name: leadOrder.driver?.driver_name || '-',
        driver_ph_no: leadOrder.driver?.mobile_number || '-',
        reaching_date_time: leadOrder.start_time ? leadOrder.start_time.toISOString() : '-',
        event_type: 'Breakdown',
        event_location: breakdownLocation,
      }),
    };
  }

  private mapEvcrfFilledDetailsArray(dto: any) {
    return [
      {
        Label: 'Date & Time',
        Value: dto.date_time
      },
      {
        Label: 'Order ID',
        Value: dto.lead_order_id
      },
      {
        Label: 'Service Type',
        Value: dto.service_type
      },
      {
        Label: 'Vehicle Brand',
        Value: dto.vehicle_brand
      },
      {
        Label: 'Vehicle Model',
        Value: dto.vehicle_model
      },
      {
        Label: 'Vehicle No.',
        Value: dto.vehicle_no
      },
      {
        Label: 'Customer Ph No.',
        Value: dto.customer_ph_no
      },
      {
        Label: 'Driver Name',
        Value: dto.driver_name
      },
      {
        Label: 'Driver Ph No.',
        Value: dto.driver_ph_no
      },
      {
        Label: 'Reaching Date & Time',
        Value: dto.reaching_date_time
      },
      {
        Label: 'Event Type',
        Value: dto.event_type
      },
      {
        Label: 'Event Location',
        Value: dto.event_location
      }
    ]
  }

  async getEvcrfPrefillDataAsync(leadOrderId: number) {
    const leadOrder = await this._prisma.lead_order.findUnique({
      where: { id: leadOrderId },
      include: { 
        vehicle: true,
        customer: true,
        driver: true,
        sub_service: true,
        locations: { where: { type: LocationType.Breakdown } }
      },
    });

    if (!leadOrder) {
      throw new NotFoundException(`Lead Order with ID ${leadOrderId} not found`);
    }

    const breakdownLocation = leadOrder.locations[0]?.address || leadOrder.locations[0]?.city || '-';

    return {
      prefill_details: this.mapEvcrfFilledDetailsArray({
        date_time: leadOrder.created_at.toISOString(),
        lead_order_id: leadOrder.formated_id,
        service_type: leadOrder.sub_service?.name || '-',
        vehicle_brand: leadOrder.vehicle?.make || '-',
        vehicle_model: leadOrder.vehicle?.model || '-',
        vehicle_no: leadOrder.vehicle?.registration_number || '-',
        customer_ph_no: leadOrder.customer?.number || '-',
        driver_name: leadOrder.driver?.driver_name || '-',
        driver_ph_no: leadOrder.driver?.mobile_number || '-',
        reaching_date_time: leadOrder.start_time ? leadOrder.start_time.toISOString() : '-',
        event_type: 'Breakdown',
        event_location: breakdownLocation,
      })
    };
  }

  async getDropoffEvcrfPrefillDataAsync(leadOrderId: number) {
    const leadOrder = await this._prisma.lead_order.findUnique({
      where: { id: leadOrderId },
      include: { 
        customer: true,
        locations: { where: { type: LocationType.Drop } }
      },
    });

    if (!leadOrder) {
      throw new NotFoundException(`Lead Order with ID ${leadOrderId} not found`);
    }

    const dropLocation = leadOrder.locations[0]?.address || leadOrder.locations[0]?.city || '-';
    const handoverName = leadOrder.customer?.full_name || '-';
    const droppingDateTime = new Date().toISOString(); 

    return {
      prefill_details: [
        { Label: "Handover's Name", Value: handoverName },
        { Label: 'Drop Location', Value: dropLocation },
        { Label: 'Droping Type', Value: '-' },
        { Label: 'Dropping (date & time)', Value: droppingDateTime },
        { Label: 'Remarks/comments', Value: '-' }
      ]
    };
  }

  async addDamageAsync(evcrfId: number, dto: AddDamageDto, file: Express.Multer.File) {
    const evcrf = await this._prisma.lead_pickup_evcrf.findUnique({
      where: { id: evcrfId },
    });

    if (!evcrf) {
      throw new NotFoundException(`Pickup EVCRF with ID ${evcrfId} not found`);
    }

    if (!file) {
      throw new BadRequestException('damage_image file is required');
    }

    const folder = `evcrf/${evcrf.lead_order_id}/pickup/damages`;

    const upload = await this._storageService.uploadFileAsync({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      folderPath: folder,
    });

    const damage = await this._prisma.lead_pickup_evcrf_damage.create({
      data: {
        lead_pickup_evcrf_id: evcrfId,
        damage_number: dto.damage_number,
        image_url: upload.url,
      },
    });

    return damage;
  }
}
