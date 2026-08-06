import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { Hash } from 'src/shared/helper/hash';
import { Role } from '@prisma/client';
@Injectable()
export class AdminService {
  constructor(private readonly _prismaService: PrismaService) {}

  async findAll() {
    const admins = await this._prismaService.admin.findMany({
      where: { is_deleted: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });
    return admins;
  }

  async create(createDto: CreateAdminDto) {
    const existingAdmin = await this._prismaService.admin.findUnique({
      where: { email: createDto.email },
    });

    if (existingAdmin) {
      throw new ConflictException('An admin with this email already exists');
    }

    const hashedPassword = await Hash.hashAsync(createDto.password);

    const newAdmin = await this._prismaService.admin.create({
      data: {
        email: createDto.email,
        name: createDto.name,
        password: hashedPassword,
        role: Role.Admin, // Only standard Admin creation allowed via API
      },
    });

    return {
      id: newAdmin.id,
      email: newAdmin.email,
      name: newAdmin.name,
      role: newAdmin.role,
    };
  }

  async findOne(id: number) {
    const admin = await this._prismaService.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_deleted: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!admin || admin.is_deleted) {
      throw new NotFoundException('Admin not found or has been deleted');
    }

    return admin;
  }

  async update(id: number, updateAdminDto: UpdateAdminDto) {
    // Check if admin exists
    await this.findOne(id); // Throws if not found or deleted

    // If updating email, check for conflicts
    if (updateAdminDto.email) {
      const existingAdmin = await this._prismaService.admin.findUnique({
        where: { email: updateAdminDto.email },
      });
      if (existingAdmin && existingAdmin.id !== id) {
        throw new ConflictException('An admin with this email already exists');
      }
    }

    const updatedAdmin = await this._prismaService.admin.update({
      where: { id },
      data: updateAdminDto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updatedAdmin;
  }

  async softDelete(id: number) {
    // Check if admin exists
    await this.findOne(id); // Throws if not found or deleted

    await this._prismaService.admin.update({
      where: { id },
      data: { is_deleted: true },
    });

    return { message: 'Admin deleted successfully' };
  }
}
