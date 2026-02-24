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

@Injectable()
export class DriverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly _storageService: StorageService,
    private readonly _callerService: CallerService,
  ) {}

  private async validateUniqueness(
    email?: string,
    number?: string,
    excludeDriverId?: number,
  ) {
    const promises: Promise<void>[] = [];

    if (email) {
      promises.push(
        this.prisma.vendor
          .findUnique({ where: { email }, select: { id: true } })
          .then((vendor) => {
            if (vendor)
              throw new BadRequestException(
                'Email is already registered as a vendor.',
              );
          }),
        this.prisma.driver
          .findUnique({ where: { email }, select: { id: true } })
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
        this.prisma.vendor
          .findUnique({ where: { number }, select: { id: true } })
          .then((vendor) => {
            if (vendor)
              throw new BadRequestException(
                'Number is already registered as a vendor.',
              );
          }),
        this.prisma.driver
          .findUnique({ where: { number }, select: { id: true } })
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

  async create(
    createDriverDto: CreateDriverDto,
    files: DriverUploadFilesPostDto,
  ) {
    this.validateRequiredFiles(files);
    await this.validateUniqueness(
      createDriverDto.email,
      createDriverDto.number,
    );

    const driver = await this.prisma.driver.create({
      data: {
        ...createDriverDto,
        vendor_id: this._callerService.getUserId(),
        formated_id: '',
        adhar_card_url: '',
        pan_card_url: '',
        driver_license_url: '',
      },
    });

    try {
      const fileUrls = await this.uploadDriverFiles(driver.id, files);
      return await this.prisma.driver.update({
        where: { id: driver.id },
        data: fileUrls,
      });
    } catch (error) {
      await this.prisma.driver.delete({ where: { id: driver.id } });
      throw error;
    }
  }

  private validateRequiredFiles(files: DriverUploadFilesPostDto): void {
    const requiredFiles: (keyof DriverUploadFilesPostDto)[] = [
      'adhar_card',
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

  private async uploadDriverFiles(
    driverId: number,
    files: DriverUploadFilesPostDto,
  ) {
    const [adharCardResult, panCardResult, driverLicenseResult] =
      await Promise.all([
        this.uploadFileAsync(
          files.adhar_card[0],
          `driver/${driverId}/documents/adhar`,
        ),
        this.uploadFileAsync(
          files.pan_card[0],
          `driver/${driverId}/documents/pan`,
        ),
        this.uploadFileAsync(
          files.driver_license[0],
          `driver/${driverId}/documents/license`,
        ),
      ]);

    return {
      adhar_card_url: adharCardResult.url,
      pan_card_url: panCardResult.url,
      driver_license_url: driverLicenseResult.url,
    };
  }

  private async uploadFileAsync(
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

  async findAll() {
    return this.prisma.driver.findMany({
      where: { is_deleted: false, vendor_id: this._callerService.getUserId() },
    });
  }

  async findOne(id: number) {
    const driver = await this.prisma.driver.findUnique({
      where: {
        id,
        is_deleted: false,
      },
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver;
  }

  async update(id: number, updateDriverDto: UpdateDriverDto) {
    // Check if exists
    await this.findOne(id);

    await this.validateUniqueness(
      updateDriverDto.email,
      updateDriverDto.number,
      id,
    );
    return this.prisma.driver.update({
      where: { id },
      data: updateDriverDto,
    });
  }

  async remove(id: number) {
    // Check if exists
    await this.findOne(id);
    return this.prisma.driver.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}
