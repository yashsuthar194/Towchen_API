import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { StorageService } from 'src/services/storage/storage.service';
import { CallerService } from 'src/services/jwt/caller.service';
import { Hash } from 'src/shared/helper/hash';
import { DriverDetailDto } from './dto/driver-detail.dto';
import { DriverListDto } from './dto/driver-list.dto';
import { DriverUploadFilesPutDto } from './dto/driver-upload-files.put.dto';
import { DriverStatus, VehicleStatus } from '@prisma/client';
import { PaginatedListDto } from '../../core/response/dto/paginated-list.dto';
import { VehicleService } from '../vehicle/vehicle.service';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';

type DriverDocumentType = 'aadhar' | 'pan' | 'license' | 'profile_image';

@Injectable()
export class DriverService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _storageService: StorageService,
    private readonly _callerService: CallerService,
    private readonly _vehicleService: VehicleService,
  ) { }

  // #region Get
  /**
   * Gets a list of active drivers for the current vendor
   * @returns Array of drivers with vehicle details
   */
  async getListAsync(status?: DriverStatus): Promise<PaginatedListDto<DriverListDto>> {
    const where = {
      is_deleted: false,
      ...(this._callerService.isVendor() ? { vendor_id: this._callerService.getUserId() } : {}),
      ...(status ? { status } : {}),
    };

    const [drivers, totalCount] = await Promise.all([
      this._prismaService.driver.findMany({
        where,
        select: {
          id: true,
          formated_id: true,
          driver_name: true,
          email: true,
          alternate_mobile_number: true,
          status: true,
          availability_status: true,
          services: true,
          created_at: true,
          vehicle: true,
        },
      }),
      this._prismaService.driver.count({ where }),
    ]);

    const list = drivers.map((d) => ({
      ...d,
      availability_status: (d.availability_status as string).replace(/_/g, ' ') as any,
    })) as unknown as DriverListDto[];

    return new PaginatedListDto(totalCount, list);
  }

  /**
   * Gets a driver by ID, ensuring they belongs to the current vendor and is not deleted
   * @param id - Driver ID
   * @returns The driver with vehicle details
   * @throws NotFoundException if driver not found
   */
  async getByIdAsync(id: number): Promise<DriverDetailDto> {
    const driver = await this._prismaService.driver.findFirst({
      where: {
        id,
        is_deleted: false,
        ...(this._callerService.isVendor() ? { vendor_id: this._callerService.getUserId() } : {}),
      },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });
    if (!driver) {
      throw new NotFoundException(`Driver not found`);
    }

    return this._mapToDetailDto(driver);
  }

  // #endregion

  // #region Create
  /**
   * Creates a new driver with uploaded documents and hashes the password
   * @param dto - Driver creation data
   * @param files - Uploaded documents (aadhar, pan, license)
   * @returns The created driver with vehicle details
   */
  async createAsync(
    dto: CreateDriverDto,
  ): Promise<DriverDetailDto> {
    await this._validateUniqueness(dto.email, dto.mobile_number);

    const driver = await this._createDriverRecord(dto);
    if (dto.vehicle_id) {
      await this._updateVehicleAvailabilityAsync(undefined, dto.vehicle_id);
    }
    return driver;
  }

  /**
   * Creates the initial driver record with empty file URLs
   * @private
   */
  private async _createDriverRecord(dto: CreateDriverDto) {
    const driverData = CreateDriverDto.toDriverData(dto);
    driverData.password = await Hash.hashAsync(dto.password);

    // If Admin creates driver, require and use vendor_id from DTO
    // If Vendor creates driver, use their own ID automatically
    const isVendor = this._callerService.isVendor();
    const vendorId = isVendor ? this._callerService.getUserId() : dto.vendor_id;

    if (!vendorId) {
      throw new BadRequestException(
        'vendor_id is required when an Admin creates a driver.',
      );
    }

    const driver = await this._prismaService.driver.create({
      data: {
        ...driverData,
        vendor_id: vendorId,
        formated_id: '',
        aadhar_card_url: '',
        pan_card_url: '',
        driver_license_url: '',
      },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });

    return this._mapToDetailDto(driver);
  }

  // #endregion

  /**
   * Gets the full profile for a driver, including vendor and vehicle details
   * @param id - Driver ID
   * @returns Detailed driver profile
   */
  async getProfileAsync(id: number): Promise<DriverDetailDto> {
    const driver = await this._prismaService.driver.findFirst({
      where: {
        id,
        is_deleted: false,
        ...(this._callerService.isVendor() ? { vendor_id: this._callerService.getUserId() } : {}),
      },
      include: {
        vendor: {
          select: {
            id: true,
            formated_id: true,
            vendor_name: true,
          },
        },
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver not found`);
    }

    return this._mapToDetailDto(driver);
  }

  /**
   * Updates the driver's own profile information
   * @param id - Driver ID
   * @param dto - Profile update data
   * @param files - Optional document updates
   */
  async updateProfileAsync(
    id: number,
    dto: any, // Using any here to facilitate internal mapping, but Controller uses UpdateDriverProfileDto
    files?: DriverUploadFilesPutDto,
  ): Promise<DriverDetailDto> {
    const currentDriver = await this._prismaService.driver.findUnique({
      where: { id },
    });

    if (!currentDriver) {
      throw new NotFoundException(`Driver not found`);
    }

    const { location_spot, ...restDto } = dto;
    const updateData: any = { ...restDto };

    if (location_spot !== undefined) {
      updateData.start_location_id = location_spot;
      updateData.end_location_id = location_spot;
    }

    // Reset verification if email or mobile number changes
    if (dto.email && dto.email !== currentDriver.email) {
      updateData.is_email_verified = false;
    }

    if (dto.mobile_number && dto.mobile_number !== currentDriver.mobile_number) {
      updateData.is_number_verified = false;
    }

    // Reuse existing file update logic
    const updatedFiles = files
      ? await this._updateDriverFilesAsync(id, files)
      : {};

    if (dto.vehicle_id) {
      await this._validateVehicleStatus(dto.vehicle_id);
    }

    const result = await this._prismaService.driver.update({
      where: { id },
      data: {
        ...updateData,
        ...updatedFiles,
      },
      include: {
        vendor: {
          select: {
            id: true,
            formated_id: true,
            vendor_name: true,
          },
        },
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });

    if (updateData.vehicle_id !== undefined && updateData.vehicle_id !== currentDriver.vehicle_id) {
      await this._updateVehicleAvailabilityAsync(currentDriver.vehicle_id || undefined, updateData.vehicle_id || undefined);
    }

    await this._checkAndSetUnderApprovalStatusAsync(id);
    return this._mapToDetailDto(result);
  }

  /**
   * Updates an existing driver's information (Vendor/Admin use)
   * @param id - Driver ID
   * @param dto - Data to update
   * @returns The updated driver with vehicle details
   */
  async updateAsync(
    id: number,
    dto: UpdateDriverDto,
  ): Promise<DriverDetailDto> {
    // Check if exists
    await this.getByIdAsync(id);

    await this._validateUniqueness(dto.email, dto.mobile_number, id);

    if (dto.vehicle_id) {
      await this._validateVehicleStatus(dto.vehicle_id);
    }

    const driverData = UpdateDriverDto.toDriverData(dto);

    // Prevent vendors from altering the vendor_id or password of a driver
    if (this._callerService.isVendor()) {
      delete (driverData as any).vendor_id;
      delete (driverData as any).password;
      (driverData as any).status = DriverStatus.Banned;
    }

    if (driverData.password) {
      driverData.password = await Hash.hashAsync(driverData.password);
    }

    const result = await this._prismaService.driver.update({
      where: { id },
      data: {
        ...driverData,
      },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });

    const currentDriver = await this._prismaService.driver.findUnique({ where: { id } });
    if (driverData.vehicle_id !== undefined && driverData.vehicle_id !== currentDriver?.vehicle_id) {
      await this._updateVehicleAvailabilityAsync(currentDriver?.vehicle_id || undefined, driverData.vehicle_id || undefined);
    }

    if (!this._callerService.isVendor()) {
      await this._checkAndSetUnderApprovalStatusAsync(id);
    }
    return this._mapToDetailDto(result);
  }

  /**
   * Assigns a vehicle to a specific driver.
   * 
   * @param dto - Assignment data (vehicle_id)
   * @returns Updated driver details
   */
  async assignVehicleAsync(
    id: number,
    dto: AssignVehicleDto,
  ): Promise<DriverDetailDto> {
    const { vehicle_id } = dto;
    const driver = await this._prismaService.driver.findUnique({
      where: { id, is_deleted: false },
    });

    if (!driver) {
      throw new NotFoundException(`Driver not found`);
    }

    // Ensure ownership if vendor
    if (this._callerService.isVendor() && driver.vendor_id !== this._callerService.getUserId()) {
      throw new NotFoundException(`Driver not found`);
    }

    // Case 1: Unassign the current vehicle
    if (vehicle_id === 0) {
      const result = await this._prismaService.driver.update({
        where: { id },
        data: { vehicle_id: null },
        include: {
          vehicle: true,
          startLocation: true,
          endLocation: true,
        },
      });

      // Mark the old vehicle as Available
      if (driver.vehicle_id) {
        await this._updateVehicleAvailabilityAsync(driver.vehicle_id, undefined);
      }

      return this._mapToDetailDto(result);
    }

    // Case 2: Assign a new vehicle
    // Validate the new vehicle
    await this._validateVehicleStatus(vehicle_id);

    // Update driver assignment
    const result = await this._prismaService.driver.update({
      where: { id },
      data: { vehicle_id: vehicle_id },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });

    // Update vehicle availability statuses
    await this._updateVehicleAvailabilityAsync(driver.vehicle_id || undefined, vehicle_id);

    return this._mapToDetailDto(result);
  }

  /**
   * Directly sets a driver's status to Banned.
   * Ensures the driver belongs to the vendor if a vendor is making the request.
   * 
   * @param id - Driver ID
   * @returns Updated driver details
   */
  async banAsync(id: number): Promise<DriverDetailDto> {
    await this.getByIdAsync(id);

    const result = await this._prismaService.driver.update({
      where: { id },
      data: { status: DriverStatus.Banned },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });

    return this._mapToDetailDto(result);
  }

  // #region Delete
  /**
   * Soft deletes a driver by setting is_deleted to true
   * @param id - Driver ID
   * @returns The deleted driver record
   */
  async deleteAsync(id: number, deletedById?: number) {
    // Check if exists
    const driver = await this.getByIdAsync(id);
    const result = await this._prismaService.driver.update({
      where: { id },
      data: {
        is_deleted: true,
        is_deleted_by: deletedById,
      },
    });

    if (driver.vehicle_id) {
      await this._updateVehicleAvailabilityAsync(driver.vehicle_id, undefined);
    }

    return result;
  }
  // #endregion

  // #region Document Upload
  /**
   * Uploads (or replaces) a single driver document.
   *
   * @param driverId - ID of the driver
   * @param documentType - Which document to upload (aadhar, pan, license)
   * @param file - The uploaded file
   * @returns An object containing the public URL of the uploaded file
   */
  async uploadDocumentAsync(
    driverId: number,
    documentType: DriverDocumentType,
    file: Express.Multer.File,
  ): Promise<{ url: string }> {
    // Verify driver exists
    await this.getByIdAsync(driverId);

    const folderPath = `driver/${driverId}/documents/${documentType}`;
    const result = await this._uploadFileAsync(file, folderPath);

    const updateData: any = this.buildDocumentUpdateData(documentType, result.url);
    if (this._callerService.isVendor()) {
      updateData.status = DriverStatus.Banned;
    }

    await this._prismaService.driver.update({
      where: { id: driverId },
      data: updateData,
    });

    if (!this._callerService.isVendor()) {
      await this._checkAndSetUnderApprovalStatusAsync(driverId);
    }

    return { url: result.url };
  }

  /**
   * Explicitly submits a driver for approval, changing status to UnderApproval.
   * Performs extensive validation to ensure all required fields and documents are present
   * and contact details are verified.
   *
   * @param id - Driver ID
   * @throws BadRequestException if any required field is missing or unverified
   */
  async submitForApprovalAsync(id: number): Promise<DriverDetailDto> {
    // 1. Retrieve driver (handles existence and vendor ownership check)
    const driver = await this._prismaService.driver.findUnique({
      where: { id, is_deleted: false },
    });

    if (!driver) {
      throw new NotFoundException(`Driver not found`);
    }

    // Ensure ownership if vendor
    if (this._callerService.isVendor() && driver.vendor_id !== this._callerService.getUserId()) {
      throw new NotFoundException(`Driver not found`);
    }

    // 2. Perform Validations
    const errors: string[] = [];

    // Required Strings (must be present and not empty)
    if (!driver.email) errors.push('Email is required');
    if (!driver.driver_name) errors.push('Driver name is required');
    if (!driver.mobile_number) errors.push('Mobile number is required');
    if (!driver.alternate_mobile_number) errors.push('Alternate mobile number is required');

    // Required Documents (Optional in schema, but required for approval)
    if (!driver.pan_card_url) errors.push('PAN card document is required');
    if (!driver.driver_license_url) errors.push('Driver license document is required');
    if (!driver.aadhar_card_url) errors.push('Aadhaar card document is required');

    // Required Identifiers (Optional in schema, but required for approval)
    if (!driver.vehicle_id) {
      errors.push('Vehicle assignment is required');
    } else {
      const vehicle = await this._prismaService.vehicle.findUnique({
        where: { id: driver.vehicle_id },
        select: { status: true },
      });
      if (vehicle?.status === VehicleStatus.Banned) {
        errors.push('Assigned vehicle is banned');
      }
    }

    if (!driver.start_location_id) errors.push('Start location is required');
    if (!driver.end_location_id) errors.push('End location is required');

    // Required Service
    if (!driver.services) {
      errors.push('A service must be assigned');
    }

    // Verification Flags
    if (!driver.is_email_verified) errors.push('Email must be verified');
    if (!driver.is_number_verified) errors.push('Mobile number must be verified');

    if (errors.length > 0) {
      throw new BadRequestException(`Submission failed: ${errors.join(', ')}`);
    }

    // 3. Update Status
    const result = await this._prismaService.driver.update({
      where: { id },
      data: { status: DriverStatus.UnderApproval },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });

    return this._mapToDetailDto(result);
  }

  /**
   * Maps a document type to the Prisma update payload that sets
   * the correct URL column.
   *
   * @param type - The document type identifier
   * @param url - The uploaded file's public URL
   * @returns A Prisma-compatible update data object
   */
  private buildDocumentUpdateData(
    type: DriverDocumentType,
    url: string,
  ): Record<string, any> {
    const mapping: Record<DriverDocumentType, Record<string, any>> = {
      aadhar: { aadhar_card_url: url },
      pan: { pan_card_url: url },
      license: { driver_license_url: url },
      profile_image: { driver_image_url: url },
    };

    return mapping[type];
  }

  /**
   * Automatically sets the driver status to UnderApproval if all documents
   * are uploaded and contact details are verified.
   * @private
   */
  private async _checkAndSetUnderApprovalStatusAsync(driverId: number) {
    const driver = await this._prismaService.driver.findUnique({
      where: { id: driverId },
    });

    if (
      driver &&
      driver.aadhar_card_url &&
      driver.pan_card_url &&
      driver.driver_license_url
    ) {
      await this._prismaService.driver.update({
        where: { id: driverId },
        data: { status: DriverStatus.UnderApproval },
      });
    }
  }
  // #endregion

  // #region Private Methods
  /**
   * Updates driver documents in storage if provided
   * @private
   */
  private async _updateDriverFilesAsync(
    driverId: number,
    files: DriverUploadFilesPutDto,
  ) {
    const [adharCardResult, panCardResult, driverLicenseResult, driverImageResult] =
      await Promise.all([
        this._updateFileAsync(
          files.aadhar_card?.[0],
          `driver/${driverId}/documents/aadhar`,
        ),
        this._updateFileAsync(
          files.pan_card?.[0],
          `driver/${driverId}/documents/pan`,
        ),
        this._updateFileAsync(
          files.driver_license?.[0],
          `driver/${driverId}/documents/license`,
        ),
        this._updateFileAsync(
          files.driver_image?.[0],
          `driver/${driverId}/documents/image`,
        ),
      ]);

    return {
      aadhar_card_url: adharCardResult?.url || undefined,
      pan_card_url: panCardResult?.url || undefined,
      driver_license_url: driverLicenseResult?.url || undefined,
      driver_image_url: driverImageResult?.url || undefined,
    };
  }

  /**
   * Validates that email and number are unique across active drivers and vendors
   * @private
   */
  private async _validateUniqueness(
    email?: string,
    number?: string,
    excludeDriverId?: number,
  ) {
    const promises: Promise<void>[] = [];

    if (email) {
      promises.push(
        this._prismaService.vendor
          .findFirst({
            where: { email, is_deleted: false },
            select: { id: true },
          })
          .then((vendor) => {
            if (vendor)
              throw new BadRequestException(
                'Email is already registered as a vendor.',
              );
          }),
        this._prismaService.driver
          .findFirst({
            where: { email, is_deleted: false },
            select: { id: true },
          })
          .then((driver) => {
            if (driver && driver.id !== excludeDriverId)
              throw new BadRequestException(
                'Email is already registered as a driver.',
              );
          }),
      );
    }

    if (number) {
      promises.push(
        this._prismaService.vendor
          .findFirst({
            where: { mobile_number: number, is_deleted: false },
            select: { id: true },
          })
          .then((vendor) => {
            if (vendor)
              throw new BadRequestException(
                'Number is already registered as a vendor.',
              );
          }),
        this._prismaService.driver
          .findFirst({
            where: { mobile_number: number, is_deleted: false },
            select: { id: true },
          })
          .then((driver) => {
            if (driver && driver.id !== excludeDriverId)
              throw new BadRequestException(
                'Number is already registered as a driver.',
              );
          }),
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }


  /**
   * Helper to upload a single file to storage
   * @private
   */
  private async _uploadFileAsync(
    file: Express.Multer.File | Express.Multer.File[],
    folderPath: string,
  ) {
    // FileFieldsInterceptor returns arrays, extract the first file
    const singleFile = Array.isArray(file) ? file[0] : file;
    return this._storageService.uploadFileAsync({
      buffer: singleFile.buffer,
      originalName: singleFile.originalname,
      mimeType: singleFile.mimetype,
      size: singleFile.size,
      folderPath,
    });
  }

  /**
   * Updates a single file in storage
   * @private
   */
  private async _updateFileAsync(
    file: Express.Multer.File | Express.Multer.File[] | undefined,
    folderPath: string,
  ) {
    // FileFieldsInterceptor returns arrays, extract the first file
    const singleFile = Array.isArray(file) ? file?.[0] : file;

    if (!singleFile) return null;

    return this._storageService.uploadFileAsync({
      buffer: singleFile.buffer,
      originalName: singleFile.originalname,
      mimeType: singleFile.mimetype,
      size: singleFile.size,
      folderPath,
    });
  }

  /**
   * Validates that a vehicle is not banned before assigning it to a driver.
   * @private
   */
  private async _validateVehicleStatus(vehicleId: number) {
    const vehicle = await this._prismaService.vehicle.findUnique({
      where: { id: vehicleId, is_deleted: false },
      select: { status: true, availability_status: true },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    if (vehicle.status !== VehicleStatus.Available) {
      throw new BadRequestException(
        `Cannot assign vehicle. Status is ${vehicle.status}, but it must be Available.`,
      );
    }

    if (vehicle.availability_status !== 'Available') {
      throw new BadRequestException(
        `Cannot assign vehicle. It is currently ${vehicle.availability_status.replace(/_/g, ' ')}.`,
      );
    }
  }

  /**
   * Maps a driver database record to DriverDetailDto,
   * Transforming startLocation to location_spot and removing sensitive fields.
   * @private
   */
  private _mapToDetailDto(driver: any): DriverDetailDto {
    const {
      password,
      startLocation,
      endLocation,
      start_location_id,
      end_location_id,
      ...rest
    } = driver;

    const is_documents_uploaded = !!(
      driver.aadhar_card_url &&
      driver.pan_card_url &&
      driver.driver_license_url &&
      driver.driver_image_url
    );

    if (rest.availability_status) {
      rest.availability_status = (rest.availability_status as string).replace(/_/g, ' ') as any;
    }

    return {
      ...rest,
      location_spot: startLocation,
      is_documents_uploaded,
    } as unknown as DriverDetailDto;
  }

  /**
   * Updates availability_status of vehicles when assignment changes
   * @private
   */
  private async _updateVehicleAvailabilityAsync(oldId?: number, newId?: number) {
    if (oldId && oldId === newId) return;

    if (oldId) {
      await this._prismaService.vehicle.update({
        where: { id: oldId },
        data: { availability_status: 'Available' },
      });
    }

    if (newId) {
      await this._prismaService.vehicle.update({
        where: { id: newId },
        data: { availability_status: 'Unavailable' },
      });
    }
  }
  // #endregion
}
