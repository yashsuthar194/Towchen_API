-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('Start', 'Breakdown', 'Drop', 'End');

-- CreateEnum
CREATE TYPE "OrderOtpType" AS ENUM ('START', 'COMPLETE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('New', 'Assigned', 'InProgress', 'Completed', 'Closed', 'OtpPending');

-- AlterTable
ALTER TABLE "driver" ADD COLUMN     "services" "VendorServices"[],
ALTER COLUMN "pan_card_url" DROP NOT NULL,
ALTER COLUMN "driver_license_url" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'Banned',
ALTER COLUMN "aadhar_card_url" DROP NOT NULL;

-- CreateTable
CREATE TABLE "order" (
    "id" SERIAL NOT NULL,
    "formated_id" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "customer_vehicle_id" INTEGER,
    "vendor_id" INTEGER,
    "driver_id" INTEGER,
    "vehicle_id" INTEGER,
    "service_type" "VendorServices" NOT NULL,
    "fleet_type" "FleetType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'New',
    "assign_time" TIMESTAMP(3),
    "start_time" TIMESTAMP(3),
    "completion_time" TIMESTAMP(3),
    "remarks" TEXT,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_location" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "type" "LocationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contact_name" VARCHAR(255),
    "contact_number" VARCHAR(20),

    CONSTRAINT "order_location_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "order_formated_id_key" ON "order"("formated_id");

-- CreateIndex
CREATE INDEX "order_customer_id_idx" ON "order"("customer_id");

-- CreateIndex
CREATE INDEX "order_driver_id_idx" ON "order"("driver_id");

-- CreateIndex
CREATE INDEX "order_status_created_at_idx" ON "order"("status", "created_at");

-- CreateIndex
CREATE INDEX "order_vehicle_id_idx" ON "order"("vehicle_id");

-- CreateIndex
CREATE INDEX "order_vendor_id_idx" ON "order"("vendor_id");

-- CreateIndex
CREATE INDEX "order_location_location_id_idx" ON "order_location"("location_id");

-- CreateIndex
CREATE INDEX "order_location_order_id_idx" ON "order_location"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_location_order_id_type_key" ON "order_location"("order_id", "type");

-- CreateIndex
CREATE INDEX "order_otp_order_id_idx" ON "order_otp"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_otp_order_id_type_key" ON "order_otp"("order_id", "type");
