/*
  Warnings:

  - Added the required column `place_id` to the `customer_address` table without a default value. This is not possible if the table is not empty.
  - Added the required column `place_id` to the `location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customer_address" ADD COLUMN     "place_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "location" ADD COLUMN     "place_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "customer_address_place_id_idx" ON "customer_address"("place_id");

-- CreateIndex
CREATE INDEX "location_place_id_idx" ON "location"("place_id");
