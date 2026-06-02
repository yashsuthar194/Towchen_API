import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "@prisma/client";
import { IsEnum, IsNotEmpty } from "class-validator";

export class WalletUpdateDto {
    @IsNotEmpty()
    @ApiProperty({ example: 1 })
    user_id: number;
    
    @IsNotEmpty()
    @ApiProperty({ example: 100 })
    amount: number;

    @IsEnum(TransactionType)
    @ApiProperty({ enum: TransactionType, example: TransactionType.CREDIT })
    transaction_type: TransactionType;
}