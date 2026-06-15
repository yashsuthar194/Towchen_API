-- CreateEnum
CREATE TYPE "JobCardType" AS ENUM ('pickup', 'dropoff');

-- CreateTable
CREATE TABLE "e_job_card" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "type" "JobCardType" NOT NULL DEFAULT 'pickup',
    "fuel_amount" VARCHAR(50),
    "odometer_reading_text" VARCHAR(100),
    "odometer_image" TEXT,
    "vehicle_class" VARCHAR(255),
    "driver_image" TEXT,
    "driver_sign" TEXT,
    "remarks" TEXT,
    "vehicle_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "e_job_card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "e_job_card_damage" (
    "id" SERIAL NOT NULL,
    "e_job_card_id" INTEGER NOT NULL,
    "damage_number" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "e_job_card_damage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_class_mapping" (
    "id" SERIAL NOT NULL,
    "source_class" VARCHAR(255) NOT NULL,
    "mapped_class" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_class_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "e_job_card_order_id_idx" ON "e_job_card"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "e_job_card_order_id_type_key" ON "e_job_card"("order_id", "type");

-- CreateIndex
CREATE INDEX "e_job_card_damage_e_job_card_id_idx" ON "e_job_card_damage"("e_job_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_class_mapping_source_class_key" ON "vehicle_class_mapping"("source_class");
