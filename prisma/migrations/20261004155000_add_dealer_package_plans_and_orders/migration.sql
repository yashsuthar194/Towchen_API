-- CreateEnum
CREATE TYPE "CarSegment" AS ENUM ('Basic', 'Standard', 'Premium');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('Manual', 'Automatic');

-- CreateEnum
CREATE TYPE "PackagePaymentStatus" AS ENUM ('PendingInternalSettlement', 'Completed', 'Waived');

-- CreateEnum
CREATE TYPE "DealerPackageStatus" AS ENUM ('Active', 'Expired', 'Cancelled');

-- CreateTable
CREATE TABLE "dealer_package_plan" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "plan_period_months" INTEGER NOT NULL,
    "incidents" INTEGER NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "hotel_accommodation" INTEGER NOT NULL DEFAULT 0,
    "cab_service" INTEGER NOT NULL DEFAULT 0,
    "price_basic" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "price_standard" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "price_premium" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_package_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_customer" (
    "id" SERIAL NOT NULL,
    "dealer_id" INTEGER NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "customer_number" VARCHAR(20) NOT NULL,
    "alternative_number" VARCHAR(20),
    "email_address" VARCHAR(255) NOT NULL,
    "building" VARCHAR(255),
    "block" VARCHAR(100),
    "road" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(20) NOT NULL,
    "gst_number" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_customer_vehicle" (
    "id" SERIAL NOT NULL,
    "dealer_customer_id" INTEGER NOT NULL,
    "vehicle_reg_number" VARCHAR(50) NOT NULL,
    "vehicle_make" VARCHAR(100) NOT NULL,
    "vehicle_model" VARCHAR(100) NOT NULL,
    "vehicle_fuel_type" "FuelType" NOT NULL,
    "transmission_type" "TransmissionType" NOT NULL,
    "registration_year" INTEGER NOT NULL,
    "chassis_number" VARCHAR(100) NOT NULL,
    "current_odometer_reading" DOUBLE PRECISION NOT NULL,
    "car_segment" "CarSegment" NOT NULL,
    "image_front" TEXT NOT NULL,
    "image_rear" TEXT NOT NULL,
    "image_left" TEXT NOT NULL,
    "image_right" TEXT NOT NULL,
    "vehicle_images_meta" JSONB,
    "odometer_image" TEXT NOT NULL,
    "odometer_image_meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_customer_vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dealer_package_order" (
    "id" SERIAL NOT NULL,
    "order_number" TEXT NOT NULL,
    "dealer_id" INTEGER NOT NULL,
    "dealer_customer_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "package_plan_id" INTEGER NOT NULL,
    "plan_name" VARCHAR(255) NOT NULL,
    "car_segment" "CarSegment" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "plan_period_months" INTEGER NOT NULL,
    "incidents_allowed" INTEGER NOT NULL,
    "incidents_used" INTEGER NOT NULL DEFAULT 0,
    "distance_km_allowed" DOUBLE PRECISION NOT NULL,
    "hotel_accommodation_allowed" INTEGER NOT NULL DEFAULT 0,
    "hotel_accommodation_used" INTEGER NOT NULL DEFAULT 0,
    "cab_service_allowed" INTEGER NOT NULL DEFAULT 0,
    "cab_service_used" INTEGER NOT NULL DEFAULT 0,
    "admin_notes" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "status" "DealerPackageStatus" NOT NULL DEFAULT 'Active',
    "payment_status" "PackagePaymentStatus" NOT NULL DEFAULT 'PendingInternalSettlement',
    "package_pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_package_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dealer_customer_dealer_id_idx" ON "dealer_customer"("dealer_id");

-- CreateIndex
CREATE INDEX "dealer_customer_customer_number_idx" ON "dealer_customer"("customer_number");

-- CreateIndex
CREATE INDEX "dealer_customer_email_address_idx" ON "dealer_customer"("email_address");

-- CreateIndex
CREATE INDEX "dealer_customer_vehicle_dealer_customer_id_idx" ON "dealer_customer_vehicle"("dealer_customer_id");

-- CreateIndex
CREATE INDEX "dealer_customer_vehicle_vehicle_reg_number_idx" ON "dealer_customer_vehicle"("vehicle_reg_number");

-- CreateIndex
CREATE UNIQUE INDEX "dealer_package_order_order_number_key" ON "dealer_package_order"("order_number");

-- CreateIndex
CREATE INDEX "dealer_package_order_dealer_id_idx" ON "dealer_package_order"("dealer_id");

-- CreateIndex
CREATE INDEX "dealer_package_order_dealer_customer_id_idx" ON "dealer_package_order"("dealer_customer_id");

-- CreateIndex
CREATE INDEX "dealer_package_order_vehicle_id_idx" ON "dealer_package_order"("vehicle_id");

-- CreateIndex
CREATE INDEX "dealer_package_order_order_number_idx" ON "dealer_package_order"("order_number");
