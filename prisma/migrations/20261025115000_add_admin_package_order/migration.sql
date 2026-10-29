-- CreateEnum
CREATE TYPE "DispatchType" AS ENUM ('Current', 'ScheduledLater');

-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('Dealer');

-- CreateEnum
CREATE TYPE "VehicleCurrentStatus" AS ENUM ('AtHouse', 'Roadside', 'Dealership', 'Workshop', 'Office', 'Other');

-- AlterTable dealer_customer_vehicle
ALTER TABLE "dealer_customer_vehicle" ADD COLUMN "variant" VARCHAR(100);
ALTER TABLE "dealer_customer_vehicle" ADD COLUMN "body_type" VARCHAR(100);

-- AlterTable dealer_package_order
ALTER TABLE "dealer_package_order" ADD COLUMN "formated_id" TEXT;
UPDATE "dealer_package_order" SET "formated_id" = 'MBR' || LPAD(id::text, 7, '0') WHERE "formated_id" IS NULL OR "formated_id" = '';
ALTER TABLE "dealer_package_order" ALTER COLUMN "formated_id" SET NOT NULL;
CREATE UNIQUE INDEX "dealer_package_order_formated_id_key" ON "dealer_package_order"("formated_id");
CREATE INDEX "dealer_package_order_formated_id_idx" ON "dealer_package_order"("formated_id");

-- CreateTable admin_package_order
CREATE TABLE "admin_package_order" (
    "id" SERIAL NOT NULL,
    "formated_id" TEXT NOT NULL,
    "order_type" "OrderType" NOT NULL DEFAULT 'Package',
    "sub_service_id" INTEGER NOT NULL,
    "dispatch_type" "DispatchType" NOT NULL DEFAULT 'Current',
    "activation_time" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "client_type" "ClientType" NOT NULL DEFAULT 'Dealer',
    "dealer_id" INTEGER NOT NULL,
    "dealer_package_order_id" INTEGER NOT NULL,
    "dealer_customer_id" INTEGER NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_number" VARCHAR(20) NOT NULL,
    "customer_alternate_number" VARCHAR(20),
    "vehicle_id" INTEGER,
    "vehicle_make" VARCHAR(100) NOT NULL,
    "vehicle_model" VARCHAR(100) NOT NULL,
    "vehicle_variant" VARCHAR(100),
    "vehicle_fuel_type" "FuelType" NOT NULL,
    "vehicle_body_type" VARCHAR(100),
    "vehicle_reg_number" VARCHAR(50) NOT NULL,
    "vehicle_chassis_number" VARCHAR(100) NOT NULL,
    "vehicle_current_status" "VehicleCurrentStatus" NOT NULL DEFAULT 'AtHouse',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extra_services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pickup_location_address" TEXT,
    "pickup_latitude" DOUBLE PRECISION,
    "pickup_longitude" DOUBLE PRECISION,
    "pickup_place_id" VARCHAR(255),
    "drop_location_address" TEXT,
    "drop_latitude" DOUBLE PRECISION,
    "drop_longitude" DOUBLE PRECISION,
    "drop_place_id" VARCHAR(255),
    "status" "OrderStatus" NOT NULL DEFAULT 'New',
    "vendor_id" INTEGER,
    "driver_id" INTEGER,
    "assigned_vehicle_id" INTEGER,
    "assign_time" TIMESTAMP(3),
    "start_time" TIMESTAMP(3),
    "completion_time" TIMESTAMP(3),
    "remarks" TEXT,
    "cancel_reason" TEXT,
    "created_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_package_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_package_order_formated_id_key" ON "admin_package_order"("formated_id");
CREATE INDEX "admin_package_order_formated_id_idx" ON "admin_package_order"("formated_id");
CREATE INDEX "admin_package_order_dealer_id_idx" ON "admin_package_order"("dealer_id");
CREATE INDEX "admin_package_order_dealer_package_order_id_idx" ON "admin_package_order"("dealer_package_order_id");
CREATE INDEX "admin_package_order_dealer_customer_id_idx" ON "admin_package_order"("dealer_customer_id");
CREATE INDEX "admin_package_order_vehicle_id_idx" ON "admin_package_order"("vehicle_id");
CREATE INDEX "admin_package_order_sub_service_id_idx" ON "admin_package_order"("sub_service_id");
CREATE INDEX "admin_package_order_driver_id_idx" ON "admin_package_order"("driver_id");
CREATE INDEX "admin_package_order_vendor_id_idx" ON "admin_package_order"("vendor_id");
CREATE INDEX "admin_package_order_assigned_vehicle_id_idx" ON "admin_package_order"("assigned_vehicle_id");
CREATE INDEX "admin_package_order_status_idx" ON "admin_package_order"("status");
CREATE INDEX "admin_package_order_status_activation_time_idx" ON "admin_package_order"("status", "activation_time");
CREATE INDEX "admin_package_order_created_at_idx" ON "admin_package_order"("created_at");
