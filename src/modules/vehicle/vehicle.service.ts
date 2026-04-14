import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { StorageService } from 'src/services/storage/storage.service';
import { CallerService } from 'src/services/jwt/caller.service';
import { VehicleDetailDto } from './dto/vehicle-detail.dto';
import { VehicleListDto } from './dto/vehicle-list.dto';

@Injectable()
export class VehicleService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _storageService: StorageService,
    private readonly _callerService: CallerService,
  ) { }

  // #region Get
  /**
   * Gets a list of active vehicles for the current vendor
   * @returns Array of vehicles
   */
  async getListAsync(): Promise<VehicleListDto[]> {
    const vendorId = this._callerService.getUserId();
    return this._prismaService.vehicle.findMany({
      where: { is_deleted: false, vendor_id: vendorId },
      select: {
        id: true,
        registration_number: true,
        chassis_number: true,
        engine_number: true,
        created_at: true,
        fleet_type: true,
        make: true,
        model: true,
        vehicle_class: true,
      },
    });
  }

  /**
   * Gets a vehicle by ID, ensuring it belongs to the current vendor
   * @param id - Vehicle ID
   * @returns The vehicle record
   * @throws NotFoundException if vehicle not found
   */
  async getByIdAsync(id: number): Promise<VehicleDetailDto> {
    const vehicle = await this._prismaService.vehicle.findUnique({
      where: {
        id,
        is_deleted: false,
      },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return vehicle as VehicleDetailDto;
  }
  // #endregion

  // #region Create
  /**
   * Registers a new vehicle (JSON only)
   * @param dto - Vehicle details
   * @returns The created vehicle record
   */
  async createAsync(
    dto: CreateVehicleDto,
  ): Promise<VehicleDetailDto> {
    await this._validateUniqueness(
      dto.registration_number,
      dto.chassis_number,
      dto.engine_number,
    );

    const vehicle = await this._createVehicleRecord(dto);
    return vehicle as unknown as VehicleDetailDto;
  }

  /**
   * Creates initial vehicle record
   * @private
   */
  private async _createVehicleRecord(dto: CreateVehicleDto) {
    const vehicleData = CreateVehicleDto.toVehicleData(dto);

    // If Admin creates vehicle, require and use vendor_id from DTO
    // If Vendor creates vehicle, use their own ID automatically
    const isVendor = this._callerService.isVendor();
    const vendorId = isVendor ? this._callerService.getUserId() : dto.vendor_id;

    if (!vendorId) {
      throw new BadRequestException('vendor_id is required when an Admin creates a vehicle.');
    }

    return this._prismaService.vehicle.create({
      data: {
        ...vehicleData,
        vendor_id: vendorId,
        vehicle_validity: new Date(dto.vehicle_validity),
        insurance_validity: new Date(dto.insurance_validity),
        fitness_validity: new Date(dto.fitness_validity),
        puc_validity: new Date(dto.puc_validity),
        vehical_image_url: [],
        chassis_image_url: [],
        tax_image_url: [],
        insurance_image_url: [],
        fitness_image_url: [],
        puc_image_url: [],
      },
    });
  }
  // #endregion

  // #region Update
  /**
   * Updates an existing vehicle's information (JSON only)
   * @param id - Vehicle ID
   * @param dto - Data to update
   * @returns The updated vehicle record
   */
  async updateAsync(
    id: number,
    dto: UpdateVehicleDto,
  ): Promise<VehicleDetailDto> {
    // Check if exists
    await this.getByIdAsync(id);

    await this._validateUniqueness(
      dto.registration_number,
      dto.chassis_number,
      dto.engine_number,
      id,
    );

    const vehicleData = UpdateVehicleDto.toVehicleData(dto);

    // Prevent vendors from altering the vendor_id of a vehicle
    if (this._callerService.isVendor()) {
      delete (vehicleData as any).vendor_id;
    }

    const data: any = {
      ...vehicleData,
    };

    if (dto.vehicle_validity) data.vehicle_validity = new Date(dto.vehicle_validity);
    if (dto.insurance_validity) data.insurance_validity = new Date(dto.insurance_validity);
    if (dto.fitness_validity) data.fitness_validity = new Date(dto.fitness_validity);
    if (dto.puc_validity) data.puc_validity = new Date(dto.puc_validity);

    return this._prismaService.vehicle.update({
      where: { id },
      data,
    }) as Promise<VehicleDetailDto>;
  }
  // #endregion

  // #region Document Upload
  /**
   * Uploads (or replaces) multiple vehicle documents for a specific category.
   *
   * @param vehicleId - ID of the vehicle
   * @param documentType - Which category to upload (vehical_image, chassis_image, etc.)
   * @param files - The uploaded files
   * @returns An object containing the public URLs of the uploaded files
   */
  async uploadFilesAsync(
    vehicleId: number,
    documentType: string,
    files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {
    // Verify vehicle exists
    await this.getByIdAsync(vehicleId);

    const urls = await Promise.all(
      files.map((file, index) =>
        this._uploadFileAsync(
          file,
          `vehicle/${vehicleId}/${documentType}/${index}`,
        ).then((res) => res.url),
      ),
    );

    await this._prismaService.vehicle.update({
      where: { id: vehicleId },
      data: {
        [`${documentType}_url`]: urls,
      },
    });

    return { urls };
  }
  // #endregion

  // #region Delete
  /**
   * Soft deletes a vehicle by setting is_deleted to true
   * @param id - Vehicle ID
   * @returns The deleted vehicle record
   */
  async deleteAsync(id: number) {
    // Check if exists
    await this.getByIdAsync(id);
    return this._prismaService.vehicle.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
  // #endregion

  // #region Private Methods
  /**
   * Validates that registration, chassis, and engine numbers are unique across active vehicles
   * @private
   */
  private async _validateUniqueness(
    registration_number?: string,
    chassis_number?: string,
    engine_number?: string,
    excludeVehicleId?: number,
  ) {
    const checks = [
      { field: 'registration_number', value: registration_number, label: 'Registration number' },
      { field: 'chassis_number', value: chassis_number, label: 'Chassis number' },
      { field: 'engine_number', value: engine_number, label: 'Engine number' },
    ];

    for (const check of checks) {
      if (check.value) {
        const existing = await this._prismaService.vehicle.findFirst({
          where: {
            [check.field]: check.value,
            is_deleted: false,
          } as any,
          select: { id: true },
        });

        if (existing && existing.id !== excludeVehicleId) {
          throw new BadRequestException(`${check.label} is already registered.`);
        }
      }
    }
  }

  /**
   * Helper to upload a single file to storage
   * @private
   */
  private async _uploadFileAsync(
    file: Express.Multer.File,
    folderPath: string,
  ) {
    return this._storageService.uploadFileAsync({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      folderPath,
    });
  }
  // #endregion
}
