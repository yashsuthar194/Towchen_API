import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { VehicleClassMappingService } from '../vehicle-class-mapping/vehicle-class-mapping.service';
import { SubmitPickupJobCardDto } from './dto/submit-pickup-job-card.dto';
import { StorageService } from 'src/services/storage/storage.service';
import { LocationType } from '@prisma/client';
import { JobCardPrefillResponseDto } from './dto/job-card-prefill-response.dto';

@Injectable()
export class EJobCardService {
  constructor(
    private readonly _prisma: PrismaService,
    private readonly _mappingService: VehicleClassMappingService,
    private readonly _storageService: StorageService,
  ) {}

  async submitPickupJobCardAsync(
    orderId: number, 
    driverId: number, 
    dto: SubmitPickupJobCardDto,
    files: {
      odometer_image?: Express.Multer.File[];
      driver_image?: Express.Multer.File[];
      driver_sign?: Express.Multer.File[];
      damage_images?: Express.Multer.File[];
    }
  ) {
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      include: { customer_vehicle: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this order');
    }

    // Physical flag will be updated to false on successful E-Job card submission

    // Check configuration exists
    const config = await this._prisma.vehicle_class_configuration.findUnique({
      where: { id: dto.vehicle_class_configuration_id }
    });
    if (!config) {
      throw new BadRequestException('Invalid vehicle_class_configuration_id');
    }

    // Upload required images
    if (!files.odometer_image?.[0]) throw new BadRequestException('odometer_image file is required');
    if (!files.driver_image?.[0]) throw new BadRequestException('driver_image file is required');
    if (!files.driver_sign?.[0]) throw new BadRequestException('driver_sign file is required');

    const folder = `e-job-card/${orderId}/pickup`;

    const [odometerUpload, driverUpload, signUpload] = await Promise.all([
      this._storageService.uploadFileAsync({
        buffer: files.odometer_image[0].buffer,
        originalName: files.odometer_image[0].originalname,
        mimeType: files.odometer_image[0].mimetype,
        size: files.odometer_image[0].size,
        folderPath: folder,
      }),
      this._storageService.uploadFileAsync({
        buffer: files.driver_image[0].buffer,
        originalName: files.driver_image[0].originalname,
        mimeType: files.driver_image[0].mimetype,
        size: files.driver_image[0].size,
        folderPath: folder,
      }),
      this._storageService.uploadFileAsync({
        buffer: files.driver_sign[0].buffer,
        originalName: files.driver_sign[0].originalname,
        mimeType: files.driver_sign[0].mimetype,
        size: files.driver_sign[0].size,
        folderPath: folder,
      }),
    ]);

    // Handle damages
    const damageData: { damage_number: number; image_url: string }[] = [];
    if (dto.damage_numbers && files.damage_images && files.damage_images.length > 0) {
      if (dto.damage_numbers.length !== files.damage_images.length) {
        throw new BadRequestException('Number of damage_images must match number of damage_numbers');
      }

      const damageUploads = await Promise.all(
        files.damage_images.map(file => 
          this._storageService.uploadFileAsync({
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            folderPath: folder + '/damages',
          })
        )
      );

      for (let i = 0; i < dto.damage_numbers.length; i++) {
        damageData.push({
          damage_number: dto.damage_numbers[i],
          image_url: damageUploads[i].url,
        });
      }
    }

    return await this._prisma.$transaction(async (tx) => {
      // Delete existing pickup job card if any (idempotent submission)
      const existing = await tx.pickup_e_job_card.findUnique({
        where: {
          order_id: orderId,
        },
      });

      if (existing) {
        await tx.pickup_e_job_card.delete({
          where: { id: existing.id },
        });
      }

      const metaPayload = {
        ...dto,
        vehicle_class_configuration_name: config.mapped_class,
        odometer_image_url: odometerUpload.url,
        driver_image_url: driverUpload.url,
        driver_sign_url: signUpload.url,
        damage_images_data: damageData,
      };

      // Remove undefined values so the JSON is clean
      const cleanMetaPayload = Object.fromEntries(
        Object.entries(metaPayload).filter(([_, v]) => v != null)
      );

      // Create new Pickup E-Job Card
      const jobCard = await tx.pickup_e_job_card.create({
        data: {
          order_id: orderId,
          fuel_amount: dto.fuel_amount,
          odometer_reading_text: dto.odometer_reading_text,
          odometer_image: odometerUpload.url,
          vehicle_class_configuration_id: dto.vehicle_class_configuration_id,
          driver_image: driverUpload.url,
          driver_sign: signUpload.url,
          remarks: dto.remarks,
          selected_accessories: dto.selected_accessories ? (dto.selected_accessories as any) : undefined,
          date_and_time: dto.date_and_time,
          service_type: dto.service_type,
          vehicle_brand: dto.vehicle_brand,
          vehicle_model: dto.vehicle_model,
          vehicle_no: dto.vehicle_no,
          customer_ph_no: dto.customer_ph_no,
          driver_name: dto.driver_name,
          driver_ph_no: dto.driver_ph_no,
          reaching_date_and_time: dto.reaching_date_and_time,
          event_type: dto.event_type,
          event_location: dto.event_location,
          time_of_day: dto.time_of_day,
          weather_condition: dto.weather_condition,
          vehicle_condition: dto.vehicle_condition,
          selected_conditions: dto.selected_conditions ? (dto.selected_conditions as any) : undefined,
          meta: Object.keys(cleanMetaPayload).length > 0 ? cleanMetaPayload : undefined,
        },
      });

      // Create damages if any
      if (damageData.length > 0) {
        await tx.pickup_e_job_card_damage.createMany({
          data: damageData.map((dmg) => ({
            pickup_e_job_card_id: jobCard.id,
            damage_number: dmg.damage_number,
            image_url: dmg.image_url,
          })),
        });
      }

      // Update order physical job card flag to false
      await tx.order.update({
        where: { id: orderId },
        data: {
          is_physical_job_card_for_pickup: false,
        },
      });

      return await tx.pickup_e_job_card.findUnique({
        where: { id: jobCard.id },
        include: { damages: true },
      });
    });
  }

  async submitDropoffJobCardAsync(
    orderId: number, 
    driverId: number, 
    dto: import('./dto/submit-dropoff-job-card.dto').SubmitDropoffJobCardDto,
    files: {
      handover_image?: Express.Multer.File[];
      handover_signature?: Express.Multer.File[];
    }
  ) {
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.driver_id !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this order');
    }

    if (!files.handover_image?.[0]) throw new BadRequestException('handover_image file is required');
    if (!files.handover_signature?.[0]) throw new BadRequestException('handover_signature file is required');

    const folder = `e-job-card/${orderId}/dropoff`;

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
      const existing = await tx.dropoff_e_job_card.findUnique({
        where: {
          order_id: orderId,
        },
      });

      if (existing) {
        await tx.dropoff_e_job_card.delete({
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

      const jobCard = await tx.dropoff_e_job_card.create({
        data: {
          order_id: orderId,
          remarks: dto.remarks,
          handover_name: dto.handover_name,
          drop_location: dto.drop_location,
          droping_type: dto.droping_type,
          dropping_date_and_time: dto.dropping_date_and_time,
          handover_image: imageUpload.url,
          handover_signature: signUpload.url,
          meta: Object.keys(cleanMetaPayload).length > 0 ? cleanMetaPayload : undefined,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          is_physical_job_card_for_dropoff: false,
        },
      });

      return await tx.dropoff_e_job_card.findUnique({
        where: { id: jobCard.id },
      });
    });
  }

  async getPickupJobCardAsync(orderId: number) {
    const jobCard = await this._prisma.pickup_e_job_card.findUnique({
      where: {
        order_id: orderId,
      },
      include: { damages: true },
    });

    if (!jobCard) {
      throw new NotFoundException(`Pickup E-Job Card for Order ${orderId} not found`);
    }

    return jobCard;
  }

  async getDropoffJobCardAsync(orderId: number) {
    const jobCard = await this._prisma.dropoff_e_job_card.findUnique({
      where: {
        order_id: orderId,
      },
    });

    if (!jobCard) {
      throw new NotFoundException(`Dropoff E-Job Card for Order ${orderId} not found`);
    }

    return jobCard;
  }

  async getJobCardConfigurationAsync(orderId: number) {
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        customer_vehicle: true,
        customer: true,
        driver: true,
        service: true,
        locations: { where: { type: LocationType.Breakdown } }
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const rawClass = order.customer_vehicle?.class;
    const resolvedClass = await this._mappingService.resolveMappedClass(rawClass);

    const config = await this._prisma.vehicle_class_configuration.findUnique({
      where: { mapped_class: resolvedClass },
      include: { 
        accessories: true,
        vehicle_states: { include: { options: true } }
      },
    });

    const breakdownLocation = order.locations[0]?.address || order.locations[0]?.city || '-';

    return {
      // Configuration data
      mapped_class: config?.mapped_class || resolvedClass,
      diagram_image_url: config?.diagram_image_url || '',
      total_damage_points: config?.total_damage_points || 0,
      accessories: config?.accessories || [],
      vehicle_state: config?.vehicle_states || [],

      // Order pre-fill data array
      prefill_details: this.mapEJobCardFilledDetailsArray({
        date_time: order.created_at.toISOString(),
        order_id: order.formated_id,
        service_type: order.service?.name || '-',
        vehicle_brand: order.customer_vehicle?.make || '-',
        vehicle_model: order.customer_vehicle?.model || '-',
        vehicle_no: order.customer_vehicle?.registration_number || '-',
        customer_ph_no: order.customer?.number || '-',
        driver_name: order.driver?.driver_name || '-',
        driver_ph_no: order.driver?.mobile_number || '-',
        reaching_date_time: order.start_time ? order.start_time.toISOString() : '-',
        event_type: 'Breakdown',
        event_location: breakdownLocation,
      }),
    };
  }

  private mapEJobCardFilledDetailsArray(dto: any) {
    return [
      {
        Label: 'Date & Time',
        Value: dto.date_time
      },
      {
        Label: 'Order ID',
        Value: dto.order_id
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

  async getJobCardPrefillDataAsync(orderId: number) {
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        customer_vehicle: true,
        customer: true,
        driver: true,
        service: true,
        locations: { where: { type: LocationType.Breakdown } }
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const breakdownLocation = order.locations[0]?.address || order.locations[0]?.city || '-';

    return {
      prefill_details: this.mapEJobCardFilledDetailsArray({
        date_time: order.created_at.toISOString(),
        order_id: order.formated_id,
        service_type: order.service?.name || '-',
        vehicle_brand: order.customer_vehicle?.make || '-',
        vehicle_model: order.customer_vehicle?.model || '-',
        vehicle_no: order.customer_vehicle?.registration_number || '-',
        customer_ph_no: order.customer?.number || '-',
        driver_name: order.driver?.driver_name || '-',
        driver_ph_no: order.driver?.mobile_number || '-',
        reaching_date_time: order.start_time ? order.start_time.toISOString() : '-',
        event_type: 'Breakdown',
        event_location: breakdownLocation,
      })
    };
  }
}
