-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('two wheeler', 'three wheeler', 'four wheeler');

-- DropForeignKey
ALTER TABLE "lead" DROP CONSTRAINT "lead_driver_id_fkey";

-- AlterTable
ALTER TABLE "customer_vehicle" ADD COLUMN     "vehicle_type" "VehicleType";

-- CreateIndex
CREATE INDEX "lead_driver_id_idx" ON "lead"("driver_id");
