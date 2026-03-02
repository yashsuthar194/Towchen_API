/*
  Warnings:

  - The values [Private,Public] on the enum `FleetType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `signature_url` to the `vendor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FleetType_new" AS ENUM ('Flatbed', 'UnderLift', 'ZeroDegree', 'TwoWFlatbed', 'Hydra');
ALTER TABLE "public"."vehicle" ALTER COLUMN "fleet_type" DROP DEFAULT;
ALTER TABLE "vehicle" ALTER COLUMN "fleet_type" TYPE "FleetType_new" USING ("fleet_type"::text::"FleetType_new");
ALTER TYPE "FleetType" RENAME TO "FleetType_old";
ALTER TYPE "FleetType_new" RENAME TO "FleetType";
DROP TYPE "public"."FleetType_old";
COMMIT;

-- DropIndex
DROP INDEX "driver_email_key";

-- DropIndex
DROP INDEX "driver_number_key";

-- DropIndex
DROP INDEX "vehicle_chassis_number_key";

-- DropIndex
DROP INDEX "vehicle_engine_number_key";

-- DropIndex
DROP INDEX "vehicle_registration_number_key";

-- DropIndex
DROP INDEX "vendor_email_key";

-- DropIndex
DROP INDEX "vendor_number_key";

-- DropIndex
DROP INDEX "vendor_org_email_key";

-- AlterTable
ALTER TABLE "driver" ADD COLUMN     "vehicle_id" INTEGER;

-- AlterTable
ALTER TABLE "vehicle" ALTER COLUMN "fleet_type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "vendor" ADD COLUMN     "agreement_status" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "signature_url" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "driver_vehicle_id_idx" ON "driver"("vehicle_id");

-- CreateIndex
CREATE INDEX "driver_vendor_id_idx" ON "driver"("vendor_id");

-- CreateIndex
CREATE INDEX "vehicle_vendor_id_idx" ON "vehicle"("vendor_id");
