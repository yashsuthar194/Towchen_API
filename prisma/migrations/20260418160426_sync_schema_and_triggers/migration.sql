-- CreateEnum
CREATE TYPE "VehicleAvailabilityStatus" AS ENUM ('Available', 'Unavailable', 'Onboard Pending');

-- AlterTable
ALTER TABLE "vehicle" ADD COLUMN     "availability_status" "VehicleAvailabilityStatus" NOT NULL DEFAULT 'Onboard Pending',
ALTER COLUMN "status" SET DEFAULT 'Banned';
