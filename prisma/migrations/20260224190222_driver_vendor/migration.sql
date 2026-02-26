/*
  Warnings:

  - Added the required column `vendor_id` to the `driver` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FleetType" AS ENUM ('Private', 'Public');

-- AlterTable
ALTER TABLE "driver" ADD COLUMN     "vendor_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "vehicle" (
    "id" SERIAL NOT NULL,
    "fleet_type" "FleetType" NOT NULL DEFAULT 'Private',
    "vendor_id" INTEGER NOT NULL,
    "fleet_location" VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(20) NOT NULL,
    "make" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "owner_name" VARCHAR(255) NOT NULL,
    "chassis_number" VARCHAR(255) NOT NULL,
    "engine_number" VARCHAR(255) NOT NULL,
    "vehicle_validity" TIMESTAMP(3) NOT NULL,
    "insurance_validity" TIMESTAMP(3) NOT NULL,
    "fitness_validity" TIMESTAMP(3) NOT NULL,
    "puc_validity" TIMESTAMP(3) NOT NULL,
    "vehical_image_url" TEXT[],
    "chassis_image_url" TEXT[],
    "tax_image_url" TEXT[],
    "insurance_image_url" TEXT[],
    "fitness_image_url" TEXT[],
    "puc_image_url" TEXT[],
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_registration_number_key" ON "vehicle"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_chassis_number_key" ON "vehicle"("chassis_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_engine_number_key" ON "vehicle"("engine_number");

-- CreateIndex
CREATE INDEX "vehicle_id_idx" ON "vehicle"("id");

-- CreateIndex
CREATE INDEX "driver_id_formated_id_idx" ON "driver"("id", "formated_id");
