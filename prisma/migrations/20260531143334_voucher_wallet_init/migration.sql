-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('Enterprise', 'Basic');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "applied_voucher_id" INTEGER,
ADD COLUMN     "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "final_amount" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "wallet" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transaction" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transaction_type" "TransactionType" NOT NULL,
    "before_transaction_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "after_transaction_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "has_expired" BOOLEAN NOT NULL DEFAULT false,
    "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "used_by_id" INTEGER,
    "used_at" TIMESTAMP(3),
    "type" "VoucherType" NOT NULL DEFAULT 'Basic',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voucher_code_key" ON "voucher"("code");

-- CreateIndex
CREATE INDEX "voucher_user_id_idx" ON "voucher"("user_id");

-- CreateIndex
CREATE INDEX "voucher_used_by_id_idx" ON "voucher"("used_by_id");

-- CreateIndex
CREATE INDEX "order_applied_voucher_id_idx" ON "order"("applied_voucher_id");
