-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('Available', 'UnAvailable', 'Onboard Pending');

-- AlterTable: driver
-- Ensure driver_image_url exists
ALTER TABLE "driver" ADD COLUMN IF NOT EXISTS "driver_image_url" TEXT;

-- Add availability_status column
ALTER TABLE "driver" ADD COLUMN "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'Onboard Pending';

-- Fix services column: drop and re-add as single enum (handles array-to-enum cast issue)
ALTER TABLE "driver" DROP COLUMN IF EXISTS "services";
ALTER TABLE "driver" ADD COLUMN "services" "VendorServices" NOT NULL DEFAULT 'Towing';

-- AlterTable: vehicle
ALTER TABLE "vehicle" ADD COLUMN IF NOT EXISTS "vehicle_class" VARCHAR(255);
