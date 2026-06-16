import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { VehicleClassMappingService } from '../vehicle-class-mapping/vehicle-class-mapping.service';
import { SubmitPickupJobCardDto } from './dto/submit-pickup-job-card.dto';
import { JobCardType } from '@prisma/client';
import { StorageService } from 'src/services/storage/storage.service';

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

    if (!order.is_e_job_card_for_pickup) {
      throw new BadRequestException('E-Job Card is not enabled for pickup on this order');
    }

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
      const existing = await tx.e_job_card.findUnique({
        where: {
          order_id_type: {
            order_id: orderId,
            type: JobCardType.pickup,
          },
        },
      });

      if (existing) {
        await tx.e_job_card.delete({
          where: { id: existing.id },
        });
      }

      const metaPayload = {
        'Date & Time': dto.date_and_time,
        'Order ID': dto.order_id,
        'Service Type': dto.service_type,
        'Vehicle Brand': dto.vehicle_brand,
        'Vehicle Model': dto.vehicle_model,
        'Vehicle No.': dto.vehicle_no,
        'Customer Ph. No.': dto.customer_ph_no,
        'Driver Name': dto.driver_name,
        'Driver Ph. No.': dto.driver_ph_no,
        'Reaching Date & Time': dto.reaching_date_and_time,
        'Event Type': dto.event_type,
        'Event Location': dto.event_location,
      };

      // Remove undefined values so the JSON is clean
      const cleanMetaPayload = Object.fromEntries(
        Object.entries(metaPayload).filter(([_, v]) => v != null)
      );

      // Create new E-Job Card
      const jobCard = await tx.e_job_card.create({
        data: {
          order_id: orderId,
          type: JobCardType.pickup,
          fuel_amount: dto.fuel_amount,
          odometer_reading_text: dto.odometer_reading_text,
          odometer_image: odometerUpload.url,
          vehicle_class_configuration_id: dto.vehicle_class_configuration_id,
          driver_image: driverUpload.url,
          driver_sign: signUpload.url,
          remarks: dto.remarks,
          selected_accessories: dto.selected_accessories || undefined,
          meta: Object.keys(cleanMetaPayload).length > 0 ? cleanMetaPayload : undefined,
        },
      });

      // Create damages if any
      if (damageData.length > 0) {
        await tx.e_job_card_damage.createMany({
          data: damageData.map((dmg) => ({
            e_job_card_id: jobCard.id,
            damage_number: dmg.damage_number,
            image_url: dmg.image_url,
          })),
        });
      }

      return await tx.e_job_card.findUnique({
        where: { id: jobCard.id },
        include: { damages: true },
      });
    });
  }

  async getPickupJobCardAsync(orderId: number) {
    const jobCard = await this._prisma.e_job_card.findUnique({
      where: {
        order_id_type: {
          order_id: orderId,
          type: JobCardType.pickup,
        },
      },
      include: { damages: true },
    });

    if (!jobCard) {
      throw new NotFoundException(`Pickup E-Job Card for Order ${orderId} not found`);
    }

    return jobCard;
  }

  async getJobCardConfigurationAsync(orderId: number) {
    const order = await this._prisma.order.findUnique({
      where: { id: orderId },
      include: { customer_vehicle: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const rawClass = order.customer_vehicle?.class;
    const resolvedClass = await this._mappingService.resolveMappedClass(rawClass);

    const config = await this._prisma.vehicle_class_configuration.findUnique({
      where: { mapped_class: resolvedClass },
    });

    if (!config) {
      return {
        mapped_class: resolvedClass,
        diagram_image_url: '',
        total_damage_points: 0,
        accessories: [],
      };
    }

    return config;
  }
}
