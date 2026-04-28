-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('New', 'Assigned', 'InProgress', 'Completed', 'Closed');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('Start', 'Breakdown', 'Drop', 'End');

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

    CONSTRAINT "order_location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_formated_id_key" ON "order"("formated_id");

-- CreateIndex
CREATE INDEX "order_customer_id_idx" ON "order"("customer_id");

-- CreateIndex
CREATE INDEX "order_driver_id_idx" ON "order"("driver_id");

-- CreateIndex
CREATE INDEX "order_vehicle_id_idx" ON "order"("vehicle_id");

-- CreateIndex
CREATE INDEX "order_vendor_id_idx" ON "order"("vendor_id");

-- CreateIndex
CREATE INDEX "order_status_created_at_idx" ON "order"("status", "created_at");

-- CreateIndex
CREATE INDEX "order_location_order_id_idx" ON "order_location"("order_id");

-- CreateIndex
CREATE INDEX "order_location_location_id_idx" ON "order_location"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_location_order_id_type_key" ON "order_location"("order_id", "type");
