-- Migration: add_vendor_location_and_pricing
-- Adds: ServiceArea enum value, vendor.location_id FK, location_pricing table, vendor_pricing table

-- AlterEnum: add ServiceArea to LocationCategory
ALTER TYPE "LocationCategory" ADD VALUE 'ServiceArea';

-- AlterTable: add nullable location_id to vendor
-- Nullable so existing vendor rows are preserved; app layer enforces it on new registrations.
ALTER TABLE "vendor" ADD COLUMN "location_id" INTEGER;

-- CreateTable: location_pricing (admin ceiling per sub-service per ServiceArea)
CREATE TABLE "location_pricing" (
    "id" SERIAL NOT NULL,
    "location_id" INTEGER NOT NULL,
    "sub_service_id" INTEGER NOT NULL,
    "fix_distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fix_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "location_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable: vendor_pricing (vendor's own pricing, copied from location_pricing at registration)
CREATE TABLE "vendor_pricing" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "sub_service_id" INTEGER NOT NULL,
    "fix_distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fix_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: location_pricing
CREATE INDEX "location_pricing_location_id_idx" ON "location_pricing"("location_id");
CREATE INDEX "location_pricing_sub_service_id_idx" ON "location_pricing"("sub_service_id");
CREATE UNIQUE INDEX "location_pricing_location_id_sub_service_id_key" ON "location_pricing"("location_id", "sub_service_id");

-- CreateIndex: vendor_pricing
CREATE INDEX "vendor_pricing_vendor_id_idx" ON "vendor_pricing"("vendor_id");
CREATE INDEX "vendor_pricing_sub_service_id_idx" ON "vendor_pricing"("sub_service_id");
CREATE UNIQUE INDEX "vendor_pricing_vendor_id_sub_service_id_key" ON "vendor_pricing"("vendor_id", "sub_service_id");

-- CreateIndex: vendor.location_id
CREATE INDEX "vendor_location_id_idx" ON "vendor"("location_id");
