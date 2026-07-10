-- AlterTable
ALTER TABLE "order" DROP COLUMN "is_physical_job_card_for_dropoff",
DROP COLUMN "is_physical_job_card_for_pickup",
DROP COLUMN "physical_dropoff_job_card_image",
DROP COLUMN "physical_pickup_job_card_image",
ADD COLUMN     "is_physical_vcrf_for_dropoff" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_physical_vcrf_for_pickup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "physical_dropoff_vcrf_image" TEXT,
ADD COLUMN     "physical_pickup_vcrf_image" TEXT;

-- DropTable
DROP TABLE "dropoff_e_job_card";

-- DropTable
DROP TABLE "pickup_e_job_card";

-- DropTable
DROP TABLE "pickup_e_job_card_damage";

-- CreateTable
CREATE TABLE "pickup_evcrf" (
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
    "selected_conditions" JSONB,
    "meta" JSONB,
    "vehicle_class_configuration_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_evcrf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_evcrf_damage" (
    "id" SERIAL NOT NULL,
    "pickup_evcrf_id" INTEGER NOT NULL,
    "damage_number" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_evcrf_damage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dropoff_evcrf" (
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

    CONSTRAINT "dropoff_evcrf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pickup_evcrf_order_id_key" ON "pickup_evcrf"("order_id");

-- CreateIndex
CREATE INDEX "pickup_evcrf_order_id_idx" ON "pickup_evcrf"("order_id");

-- CreateIndex
CREATE INDEX "pickup_evcrf_vehicle_class_configuration_id_idx" ON "pickup_evcrf"("vehicle_class_configuration_id");

-- CreateIndex
CREATE INDEX "pickup_evcrf_damage_pickup_evcrf_id_idx" ON "pickup_evcrf_damage"("pickup_evcrf_id");

-- CreateIndex
CREATE UNIQUE INDEX "dropoff_evcrf_order_id_key" ON "dropoff_evcrf"("order_id");

-- CreateIndex
CREATE INDEX "dropoff_evcrf_order_id_idx" ON "dropoff_evcrf"("order_id");
