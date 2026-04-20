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
import { VehicleStatus, AvailabilityStatus } from '@prisma/client';
import { PaginatedListDto } from '../../core/response/dto/paginated-list.dto';

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
   * @param status Optional vehicle status filter
   * @returns Paginated object containing total_count and list of vehicles
   */
  async getListAsync(status?: VehicleStatus): Promise<PaginatedListDto<VehicleListDto>> {
    const vendorId = this._callerService.getUserId();
    const where = {
      is_deleted: false,
      vendor_id: vendorId,
      ...(status ? { status } : {}),
    };

    const [vehicles, totalCount] = await Promise.all([
      this._prismaService.vehicle.findMany({
        where,
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
          status: true,
          availability_status: true,
          drivers: {
            where: { is_deleted: false },
            select: {
              id: true,
              driver_name: true,
              mobile_number: true,
            },
          },
        },
      }),
      this._prismaService.vehicle.count({ where }),
    ]);

    if (vehicles.length === 0) {
      throw new NotFoundException('No vehicles found');
    }

    const list = vehicles.map((v) => this._mapToDto<VehicleListDto>(v));
    return new PaginatedListDto(totalCount, list);
  }

  /**
   * Gets a list of available vehicles for the current vendor
   * @returns Array of available vehicles
   */
  async getAvailableListAsync(): Promise<VehicleListDto[]> {
    const vendorId = this._callerService.getUserId();
    const vehicles = await this._prismaService.vehicle.findMany({
      where: {
        is_deleted: false,
        vendor_id: vendorId,
        status: 'Available',
        drivers: {
          none: {},
        },
      },
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
        status: true,
        availability_status: true,
        drivers: {
          where: { is_deleted: false },
          select: {
            id: true,
            driver_name: true,
            mobile_number: true,
          },
        },
      },
    });

    if (vehicles.length === 0) {
      throw new NotFoundException('No vehicles are available');
    }

    return vehicles.map((v) => this._mapToDto<VehicleListDto>(v));
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
      include: {
        drivers: {
          where: { is_deleted: false },
          select: {
            id: true,
            driver_name: true,
            mobile_number: true,
          },
        },
      },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    return this._mapToDto<VehicleDetailDto>(vehicle);
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
    return this._mapToDto<VehicleDetailDto>(vehicle);
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
        chassis_image_url: null,
        tax_image_url: null,
        insurance_image_url: null,
        fitness_image_url: null,
        puc_image_url: null,
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

    const result = await this._prismaService.vehicle.update({
      where: { id },
      data,
    });
    return this._mapToDto<VehicleDetailDto>(result);
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
  async uploadDocumentsAsync(
    vehicleId: number,
    documentType: string,
    files: Express.Multer.File[],
  ): Promise<{ urls: string[] }> {    // Verify vehicle exists
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

  /**
   * Uploads (or replaces) a single vehicle document for a specific category.
   *
   * @param vehicleId - ID of the vehicle
   * @param documentType - Which category to upload (chassis_image, tax_image, etc.)
   * @param file - The uploaded file
   * @returns An object containing the public URL of the uploaded file
   */
  async uploadDocumentAsync(
    vehicleId: number,
    documentType: string,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {    // Verify vehicle exists
    await this.getByIdAsync(vehicleId);

    const result = await this._uploadFileAsync(
      file,
      `vehicle/${vehicleId}/${documentType}`,
    );

    await this._prismaService.vehicle.update({
      where: { id: vehicleId },
      data: {
        [`${documentType}_url`]: result.url,
      },
    });

    return { url: result.url };
  }
  // #endregion

  // #region Approval
  /**
   * Submits a vehicle for approval, transitioning its status to Available.
   *
   * @param id - Vehicle ID
   * @returns The updated vehicle record mapped to VehicleDetailDto
   * @throws NotFoundException if vehicle not found
   */
  async submitForApprovalAsync(id: number): Promise<VehicleDetailDto> {
    const vehicle = await this._prismaService.vehicle.findUnique({
      where: { id, is_deleted: false },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    // Ensure ownership if vendor
    if (this._callerService.isVendor() && vehicle.vendor_id !== this._callerService.getUserId()) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    // Validate that all required fields and documents are present
    const errors: string[] = [];

    // Basic Information
    if (!vehicle.fleet_location) errors.push('Fleet location is required');
    if (!vehicle.registration_number) errors.push('Registration number is required');
    if (!vehicle.make) errors.push('Make is required');
    if (!vehicle.model) errors.push('Model is required');
    if (!vehicle.owner_name) errors.push('Owner name is required');
    if (!vehicle.chassis_number) errors.push('Chassis number is required');
    if (!vehicle.engine_number) errors.push('Engine number is required');

    // Validity Dates
    if (!vehicle.vehicle_validity) errors.push('Vehicle validity is required');
    if (!vehicle.insurance_validity) errors.push('Insurance validity is required');
    if (!vehicle.fitness_validity) errors.push('Fitness validity is required');
    if (!vehicle.puc_validity) errors.push('PUC validity is required');

    // Documents
    if (!vehicle.vehical_image_url || vehicle.vehical_image_url.length === 0) errors.push('Vehicle images are required');
    if (!vehicle.chassis_image_url) errors.push('Chassis image is required');
    if (!vehicle.tax_image_url) errors.push('Tax image is required');
    if (!vehicle.insurance_image_url) errors.push('Insurance image is required');
    if (!vehicle.fitness_image_url) errors.push('Fitness image is required');
    if (!vehicle.puc_image_url) errors.push('PUC image is required');

    if (errors.length > 0) {
      throw new BadRequestException(`Submission failed: ${errors.join(', ')}`);
    }

    const updatedVehicle = await this._prismaService.vehicle.update({
      where: { id },
      data: { status: 'UnderApproval', availability_status: 'Onboard_Pending' },
    });

    return this._mapToDto<VehicleDetailDto>(updatedVehicle);
  }

  /**
   * Bans a vehicle, transitioning its status to Banned.
   *
   * @param id - Vehicle ID
   * @returns The updated vehicle record mapped to VehicleDetailDto
   * @throws NotFoundException if vehicle not found
   */
  async banAsync(id: number): Promise<VehicleDetailDto> {
    const vehicle = await this._prismaService.vehicle.findUnique({
      where: { id, is_deleted: false },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    // Ensure ownership if vendor
    if (this._callerService.isVendor() && vehicle.vendor_id !== this._callerService.getUserId()) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const updatedVehicle = await this._prismaService.vehicle.update({
      where: { id },
      data: { status: 'Banned', availability_status: 'Unavailable' },
    });

    return this._mapToDto<VehicleDetailDto>(updatedVehicle);
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

  /**
   * Helper to map database record to DTO and format fields
   * @private
   */
  private _mapToDto<T>(vehicle: any): T {
    if (vehicle && vehicle.availability_status) {
      vehicle.availability_status = vehicle.availability_status.replace(/_/g, ' ');
    }

    // Ensure document URLs return null instead of empty objects or literal "{}"
    const documentFields = [
      'chassis_image_url',
      'tax_image_url',
      'insurance_image_url',
      'fitness_image_url',
      'puc_image_url',
    ];

    documentFields.forEach((field) => {
      if (
        vehicle[field] === '{}' ||
        (vehicle[field] &&
          typeof vehicle[field] === 'object' &&
          Object.keys(vehicle[field]).length === 0)
      ) {
        vehicle[field] = null;
      }
    });
    
    if (vehicle && vehicle.drivers) {
      const { drivers, ...rest } = vehicle;
      return {
        ...rest,
        driver: drivers.length > 0 ? drivers[0] : null,
      } as T;
    }
    
    return vehicle as T;
  }
}
