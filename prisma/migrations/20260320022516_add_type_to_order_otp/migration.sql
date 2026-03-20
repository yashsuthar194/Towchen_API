-- CreateEnum
CREATE TYPE "OrderOtpType" AS ENUM ('START', 'COMPLETE');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'OtpPending';

-- CreateTable
CREATE TABLE "order_otp" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "type" "OrderOtpType" NOT NULL DEFAULT 'START',
    "otp" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_otp_order_id_idx" ON "order_otp"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_otp_order_id_type_key" ON "order_otp"("order_id", "type");
