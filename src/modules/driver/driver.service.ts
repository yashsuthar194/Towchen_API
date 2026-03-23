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
import { DriverStatus } from '@prisma/client';

type DriverDocumentType = 'aadhar' | 'pan' | 'license';

@Injectable()
export class DriverService {
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _storageService: StorageService,
    private readonly _callerService: CallerService,
  ) {}

  // #region Get
  /**
   * Gets a list of active drivers for the current vendor
   * @returns Array of drivers with vehicle details
   */
  async getListAsync(): Promise<DriverListDto[]> {
    return this._prismaService.driver.findMany({
      where: { is_deleted: false, vendor_id: this._callerService.getUserId() },
      select: {
        id: true,
        formated_id: true,
        driver_name: true,
        email: true,
        alternate_mobile_number: true,
        status: true,
        created_at: true,
      },
    });
  }

  /**
   * Gets a driver by ID, ensuring they belongs to the current vendor and is not deleted
   * @param id - Driver ID
   * @returns The driver with vehicle details
   * @throws NotFoundException if driver not found
   */
  async getByIdAsync(id: number): Promise<DriverDetailDto> {
    const driver = await this._prismaService.driver.findUnique({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver as unknown as DriverDetailDto;
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

    return await this._createDriverRecord(dto);
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

    return this._prismaService.driver.create({
      data: {
        ...driverData,
        vendor_id: vendorId,
        formated_id: '',
      },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    }) as unknown as Promise<DriverDetailDto>;
  }

  // #endregion

  /**
   * Gets the full profile for a driver, including vendor and vehicle details
   * @param id - Driver ID
   * @returns Detailed driver profile
   */
  async getProfileAsync(id: number): Promise<DriverDetailDto> {
    const driver = await this._prismaService.driver.findUnique({
      where: { id, is_deleted: false },
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
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    return driver as unknown as DriverDetailDto;
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
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    const updateData: any = { ...dto };

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

    const result = (await this._prismaService.driver.update({
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
    })) as unknown as DriverDetailDto;

    await this._checkAndSetUnderApprovalStatusAsync(id);
    return result;
  }

  /**
   * Updates an existing driver's information (Vendor/Admin use)
   * @param id - Driver ID
   * @param dto - Data to update
   * @param files - Optional file updates
   * @returns The updated driver with vehicle details
   */
  async updateAsync(
    id: number,
    dto: UpdateDriverDto,
    files?: DriverUploadFilesPutDto,
  ): Promise<DriverDetailDto> {
    // Check if exists
    await this.getByIdAsync(id);

    await this._validateUniqueness(dto.email, dto.mobile_number, id);

    const updatedFiles = files
      ? await this._updateDriverFilesAsync(id, files)
      : {};

    const driverData = UpdateDriverDto.toDriverData(dto);
    if (driverData.password) {
      driverData.password = await Hash.hashAsync(driverData.password);
    }

    const result = (await this._prismaService.driver.update({
      where: { id },
      data: {
        ...driverData,
        ...updatedFiles,
      },
      include: {
        vehicle: true,
        startLocation: true,
        endLocation: true,
      },
    })) as unknown as DriverDetailDto;

    await this._checkAndSetUnderApprovalStatusAsync(id);
    return result;
  }

  // #region Delete
  /**
   * Soft deletes a driver by setting is_deleted to true
   * @param id - Driver ID
   * @returns The deleted driver record
   */
  async deleteAsync(id: number) {
    // Check if exists
    await this.getByIdAsync(id);
    return this._prismaService.driver.update({
      where: { id },
      data: {
        is_deleted: true,
      },
    });
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

    const updateData = this.buildDocumentUpdateData(documentType, result.url);
    await this._prismaService.driver.update({
      where: { id: driverId },
      data: updateData,
    });

    await this._checkAndSetUnderApprovalStatusAsync(driverId);

    return { url: result.url };
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
      driver.driver_license_url &&
      driver.is_email_verified &&
      driver.is_number_verified
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
    const [adharCardResult, panCardResult, driverLicenseResult] =
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
      ]);

    return {
      aadhar_card_url: adharCardResult?.url || undefined,
      pan_card_url: panCardResult?.url || undefined,
      driver_license_url: driverLicenseResult?.url || undefined,
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
  // #endregion
}
