-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('Available', 'UnderApproval', 'Banned');

-- AlterTable
ALTER TABLE "vehicle" ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'UnderApproval';
