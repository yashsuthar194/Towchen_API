import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { StorageService } from 'src/services/storage/storage.service';
import { DriverUploadFilesPostDto } from './dto/driver-upload-files.post.dto';
import { CallerService } from 'src/services/jwt/caller.service';
import { Hash } from 'src/shared/helper/hash';
import { DriverDetailDto } from './dto/driver-detail.dto';
import { DriverListDto } from './dto/driver-list.dto';
import { DriverUploadFilesPutDto } from './dto/driver-upload-files.put.dto';

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
      include: { vehicle: true },
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
   * @param files - Uploaded documents (adhar, pan, license)
   * @returns The created driver with vehicle details
   */
  async createAsync(
    dto: CreateDriverDto,
    files: DriverUploadFilesPostDto,
  ): Promise<DriverDetailDto> {
    this._validateRequiredFiles(files);
    await this._validateUniqueness(dto.email, dto.mobile_number);

    const driver = await this._createDriverRecord(dto);

    try {
      const fileUrls = await this._uploadDriverFiles(driver.id, files);
      return await this._updateDriverWithFileUrls(driver.id, fileUrls);
    } catch (error) {
      await this._rollbackDriverCreation(driver.id);
      throw error;
    }
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
        adhar_card_url: '',
        pan_card_url: '',
        driver_license_url: '',
      },
    });
  }

  /**
   * Updates driver record with uploaded file URLs
   * @private
   */
  private async _updateDriverWithFileUrls(
    driverId: number,
    fileUrls: {
      aadhar_card_url: string;
      pan_card_url: string;
      driver_license_url: string;
    },
  ): Promise<DriverDetailDto> {
    return this._prismaService.driver.update({
      where: { id: driverId },
      data: fileUrls,
      include: { vehicle: true },
    }) as Promise<DriverDetailDto>;
  }

  /**
   * Compensating action: removes driver on failure
   * @private
   */
  private async _rollbackDriverCreation(driverId: number): Promise<void> {
    await this._prismaService.driver.delete({ where: { id: driverId } });
  }
  // #endregion

  // #region Update
  /**
   * Updates an existing driver's information and hashes the password if provided
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

    return this._prismaService.driver.update({
      where: { id },
      data: {
        ...driverData,
        ...updatedFiles,
      },
      include: { vehicle: true },
    }) as Promise<DriverDetailDto>;
  }
  // #endregion

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
          `driver/${driverId}/documents/adhar`,
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
   * Validates that all required files are present during creation
   * @private
   */
  private _validateRequiredFiles(files: DriverUploadFilesPostDto): void {
    const requiredFiles: (keyof DriverUploadFilesPostDto)[] = [
      'aadhar_card',
      'pan_card',
      'driver_license',
    ];

    const missingFiles = requiredFiles.filter((field) => !files[field]);

    if (missingFiles.length > 0) {
      throw new BadRequestException(
        `Missing required files: ${missingFiles.join(', ')}`,
      );
    }
  }

  /**
   * Uploads driver-related documents to storage
   * @private
   */
  private async _uploadDriverFiles(
    driverId: number,
    files: DriverUploadFilesPostDto,
  ) {
    const [adharCardResult, panCardResult, driverLicenseResult] =
      await Promise.all([
        this._uploadFileAsync(
          files.aadhar_card[0],
          `driver/${driverId}/documents/adhar`,
        ),
        this._uploadFileAsync(
          files.pan_card[0],
          `driver/${driverId}/documents/pan`,
        ),
        this._uploadFileAsync(
          files.driver_license[0],
          `driver/${driverId}/documents/license`,
        ),
      ]);

    return {
      aadhar_card_url: adharCardResult.url,
      pan_card_url: panCardResult.url,
      driver_license_url: driverLicenseResult.url,
    };
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
