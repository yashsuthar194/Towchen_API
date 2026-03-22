/*
  Warnings:

  - You are about to drop the column `end_location` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `start_location` on the `driver` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "driver_id_formated_id_idx";

-- AlterTable
ALTER TABLE "driver" DROP COLUMN "end_location",
DROP COLUMN "start_location",
ADD COLUMN     "end_location_id" INTEGER,
ADD COLUMN     "start_location_id" INTEGER,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "driver_start_location_id_idx" ON "driver"("start_location_id");

-- CreateIndex
CREATE INDEX "driver_end_location_id_idx" ON "driver"("end_location_id");

-- CreateIndex
CREATE INDEX "driver_location_city_idx" ON "driver_location"("city");

-- CreateIndex
CREATE INDEX "driver_location_state_idx" ON "driver_location"("state");
