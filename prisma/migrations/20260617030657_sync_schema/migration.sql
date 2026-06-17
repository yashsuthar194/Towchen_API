/*
  Warnings:

  - You are about to drop the column `is_e_job_card_for_dropoff` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `is_e_job_card_for_pickup` on the `order` table. All the data in the column will be lost.
  - You are about to drop the `e_job_card` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `e_job_card_damage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle_class_mapping` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "order" DROP COLUMN "is_e_job_card_for_dropoff",
DROP COLUMN "is_e_job_card_for_pickup",
ADD COLUMN     "is_physical_job_card_for_dropoff" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_physical_job_card_for_pickup" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "vehicle_class_configuration" ADD COLUMN     "accessories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sub_classes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropTable
DROP TABLE "e_job_card";

-- DropTable
DROP TABLE "e_job_card_damage";

-- DropTable
DROP TABLE "vehicle_class_mapping";

-- DropEnum
DROP TYPE "JobCardType";

-- CreateTable
CREATE TABLE "pickup_e_job_card" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "fuel_amount" VARCHAR(50),
    "odometer_reading_text" VARCHAR(100),
    "odometer_image" TEXT,
    "driver_image" TEXT,
    "driver_sign" TEXT,
    "remarks" TEXT,
    "selected_accessories" JSONB,
    "date_and_time" VARCHAR(255),
    "service_type" VARCHAR(255),
    "vehicle_brand" VARCHAR(255),
    "vehicle_model" VARCHAR(255),
    "vehicle_no" VARCHAR(255),
    "customer_ph_no" VARCHAR(50),
    "driver_name" VARCHAR(255),
    "driver_ph_no" VARCHAR(50),
    "reaching_date_and_time" VARCHAR(255),
    "event_type" VARCHAR(255),
    "event_location" VARCHAR(255),
    "time_of_day" VARCHAR(50),
    "weather_condition" VARCHAR(50),
    "vehicle_condition" VARCHAR(50),
    "meta" JSONB,
    "vehicle_class_configuration_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_e_job_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_e_job_card_damage" (
    "id" SERIAL NOT NULL,
    "pickup_e_job_card_id" INTEGER NOT NULL,
    "damage_number" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_e_job_card_damage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dropoff_e_job_card" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "remarks" TEXT,
    "handover_name" VARCHAR(255),
    "drop_location" VARCHAR(255),
    "droping_type" VARCHAR(255),
    "dropping_date_and_time" VARCHAR(255),
    "handover_image" TEXT,
    "handover_signature" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dropoff_e_job_card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pickup_e_job_card_order_id_key" ON "pickup_e_job_card"("order_id");

-- CreateIndex
CREATE INDEX "pickup_e_job_card_order_id_idx" ON "pickup_e_job_card"("order_id");

-- CreateIndex
CREATE INDEX "pickup_e_job_card_vehicle_class_configuration_id_idx" ON "pickup_e_job_card"("vehicle_class_configuration_id");

-- CreateIndex
CREATE INDEX "pickup_e_job_card_damage_pickup_e_job_card_id_idx" ON "pickup_e_job_card_damage"("pickup_e_job_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "dropoff_e_job_card_order_id_key" ON "dropoff_e_job_card"("order_id");

-- CreateIndex
CREATE INDEX "dropoff_e_job_card_order_id_idx" ON "dropoff_e_job_card"("order_id");
