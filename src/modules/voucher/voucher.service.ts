import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, voucher } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
import { CalculateVoucherRequestDto, CalculatedVoucherResponseDto } from './dto/calculate-voucher.dto';
import { Utility } from 'src/shared/helper/utility';

@Injectable()
export class VoucherService {
    constructor(private readonly _prisma: PrismaService) {}

    /**
     * Generates a new unique percentage-based voucher for the given user.
     * Can be invoked manually via endpoint or automatically on registration.
     */
    async generateVoucherAsync(userId: number, tx?: Prisma.TransactionClient): Promise<voucher> {
        const client = tx ?? this._prisma;

        // Generate a secure random unique alphanumeric code (e.g., TOW-XXXXXX)
        let uniqueCode = '';
        let exists = true;
        
        while (exists) {
            uniqueCode = Utility.generateAlphanumericCode(8);

            const check = await client.voucher.findUnique({
                where: { code: uniqueCode }
            });
            if (!check) {
                exists = false;
            }
        }

        return await client.voucher.create({
            data: {
                user_id: userId,
                code: uniqueCode,
                discount_percent: 15.0, // Default 15% discount
                has_expired: false
            }
        });
    }

    /**
     * Checks validation rules for applying a voucher code.
     */
    async validateVoucherAsync(code: string, userId: number): Promise<voucher> {
        const cleanedCode = code.trim().toUpperCase();
        const voucher = await this._prisma.voucher.findUnique({
            where: { code: cleanedCode }
        });

        if (!voucher) {
            throw new NotFoundException(`Voucher code "${cleanedCode}" does not exist.`);
        }

        if (voucher.has_expired || voucher.used_by_id) {
            throw new BadRequestException('This voucher has already been used and is expired.');
        }

        if (voucher.user_id === userId) {
            throw new BadRequestException('You cannot apply a voucher code that you yourself created.');
        }

        return voucher;
    }

    /**
     * Redeem a voucher atomically during the order creation transaction context.
     */
    async redeemVoucherAsync(code: string, userId: number, tx: Prisma.TransactionClient): Promise<voucher> {
        const cleanedCode = code.trim().toUpperCase();

        // 1. Double check validation using normal checks (raises detailed exceptions)
        await this.validateVoucherAsync(cleanedCode, userId);

        try {
            // 2. Atomic update checking double spend concurrency
            return await tx.voucher.update({
                where: {
                    code: cleanedCode,
                    has_expired: false,
                    used_by_id: null
                },
                data: {
                    has_expired: true,
                    used_by_id: userId,
                    used_at: new Date()
                }
            });
        } catch (error) {
            throw new BadRequestException('Voucher has already been redeemed or is invalid.');
        }
    }

    /**
     * Gets all vouchers created by a specific user.
     */
    async getUserVouchersAsync(userId: number): Promise<voucher[]> {
        return await this._prisma.voucher.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });
    }

    /**
     * Calculates the new pricing details based on a voucher application.
     */
    async calculateDiscountAsync(dto: CalculateVoucherRequestDto, userId: number): Promise<CalculatedVoucherResponseDto> {
        // 1. Validate the voucher
        const voucher = await this.validateVoucherAsync(dto.voucher_code, userId);

        // 2. Clone the sub_service to avoid mutating original
        const updatedSubService = { ...dto.sub_service };

        // 3. Calculate discount amount based on base price (final_amount_int)
        const basePrice = updatedSubService.final_amount_int;
        const discountAmount = parseFloat((basePrice * (voucher.discount_percent / 100)).toFixed(2));
        const newBasePrice = Math.max(0, basePrice - discountAmount);

        // 4. Recalculate Taxes on the new base price
        const cgstRate = updatedSubService.cgst_rate_int / 100;
        const sgstRate = updatedSubService.sgst_rate_int / 100;
        const otherTaxRate = updatedSubService.other_tax_rate_int / 100;

        const newCgst = parseFloat((newBasePrice * cgstRate).toFixed(2));
        const newSgst = parseFloat((newBasePrice * sgstRate).toFixed(2));
        const newOtherTax = parseFloat((newBasePrice * otherTaxRate).toFixed(2));

        const newGrandTotal = parseFloat((newBasePrice + newCgst + newSgst + newOtherTax).toFixed(2));

        // 5. Update the sub-service object
        updatedSubService.cgst_int = newCgst;
        updatedSubService.sgst_int = newSgst;
        updatedSubService.other_tax_int = newOtherTax;
        updatedSubService.grand_total_int = newGrandTotal;

        // Format strings
        updatedSubService.cgst_string = `₹${newCgst.toFixed(2)}`;
        updatedSubService.sgst_string = `₹${newSgst.toFixed(2)}`;
        updatedSubService.other_tax_string = `₹${newOtherTax.toFixed(2)}`;
        updatedSubService.grand_total_string = `₹${newGrandTotal.toFixed(2)}`;

        return {
            applied_voucher_code: voucher.code,
            discount_percent: voucher.discount_percent,
            discount_amount: discountAmount,
            discount_amount_formatted: `₹${discountAmount.toFixed(2)}`,
            updated_sub_service: updatedSubService
        };
    }
}
