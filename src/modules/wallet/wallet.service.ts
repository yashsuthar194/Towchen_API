import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, TransactionType, wallet } from '@prisma/client';
import { PrismaService } from 'src/core/prisma/prisma.service';
@Injectable()
export class WalletService {
    constructor(private readonly _prismaService: PrismaService) { }

    //#region GET
    /**
     * @description get user wallet
     * @returns 
     */
    async getUserWallet(userId: number): Promise<wallet> {
        return this.getOrCreateWalletByUserId(userId);
    }

    /**
     * Expose a safe way to fetch or generate a wallet by explicit user_id
     */
    async getOrCreateWalletByUserId(userId: number, tx?: Prisma.TransactionClient): Promise<wallet> {
        const client = tx ?? this._prismaService;
        const existingWallet = await client.wallet.findFirst({
            where: {
                user_id: userId
            }
        });

        if (existingWallet == null) {
            return await client.wallet.create({
                data: {
                    user_id: userId,
                    balance: 0
                }
            });
        }

        return existingWallet;
    }
    //#endregion

    //#region ADD
    /**
     * @description generate user wallet
     * @param user_id 
     * @returns 
     */
    async generateUserWallet(user_id: number): Promise<wallet> {
        const wallet = await this._prismaService.wallet.create({
            data: {
                user_id,
                balance: 0
            }
        });

        return wallet;
    }
    //#endregion

    //#region UPDATE
    /**
     * Update wallet balance and log a transaction history item.
     * Fully parameterized by user_id and supports transaction propagation.
     * @param user_id 
     * @param amount 
     * @param transaction_type
     * @param tx Optional transaction client
     * @returns 
     */
    async updateWallet(
        user_id: number,
        amount: number,
        transaction_type: TransactionType,
        tx?: Prisma.TransactionClient
    ): Promise<wallet> {
        const executeUpdate = async (client: Prisma.TransactionClient) => {
            const wallet = await this.getOrCreateWalletByUserId(user_id, client);
            const balance = wallet.balance;

            let newBalance: number;
            
            if (transaction_type === TransactionType.DEBIT) {
                newBalance = balance - amount;
                if (newBalance < 0) {
                    throw new BadRequestException('Insufficient balance');
                }
            } else {
                newBalance = balance + amount;
            }

            // Create wallet transaction logging record
            await client.wallet_transaction.create({
                data: {
                    user_id,
                    wallet_id: wallet.id,
                    amount,
                    transaction_type,
                    before_transaction_amount: balance,
                    after_transaction_amount: newBalance
                }
            });

            // Update balance in the database
            return await client.wallet.update({
                where: {
                    id: wallet.id
                },
                data: {
                    balance: newBalance
                }
            });
        };

        if (tx) {
            return await executeUpdate(tx);
        } else {
            return await this._prismaService.$transaction(async (prismaTx) => {
                return await executeUpdate(prismaTx);
            });
        }
    }
    //#endregion
}
