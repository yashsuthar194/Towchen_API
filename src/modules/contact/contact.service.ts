import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateContactInquiryDto } from './dto/create-contact-inquiry.dto';
import { ContactInquiryDto } from './dto/contact-inquiry.dto';

@Injectable()
export class ContactService {
  constructor(private readonly _prisma: PrismaService) {}

  /**
   * Creates and stores a new contact inquiry in the database.
   */
  async createInquiryAsync(dto: CreateContactInquiryDto): Promise<ContactInquiryDto> {
    const inquiry = await this._prisma.contact_inquiry.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        email: dto.email.trim().toLowerCase(),
        subject: dto.subject.trim(),
        message: dto.message.trim(),
      },
    });

    return inquiry;
  }

  /**
   * Fetches all contact inquiries ordered by newest first.
   */
  async findAllAsync(): Promise<ContactInquiryDto[]> {
    const inquiries = await this._prisma.contact_inquiry.findMany({
      orderBy: { created_at: 'desc' },
    });

    return inquiries;
  }

  /**
   * Fetches a single contact inquiry by ID.
   */
  async findOneAsync(id: number): Promise<ContactInquiryDto> {
    const inquiry = await this._prisma.contact_inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      throw new NotFoundException(`Contact inquiry with ID ${id} not found`);
    }

    return inquiry;
  }
}
