/*
  Warnings:

  - You are about to drop the `driver_location` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "LocationCategory" AS ENUM ('Driver', 'Order');

-- DropTable
DROP TABLE "driver_location";

-- CreateTable
CREATE TABLE "location" (
    "id" SERIAL NOT NULL,
    "address" TEXT,
    "street" TEXT,
    "area" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "landmark" TEXT,
    "description" TEXT,
    "category" "LocationCategory" NOT NULL DEFAULT 'Driver',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_city_idx" ON "location"("city");

-- CreateIndex
CREATE INDEX "location_state_idx" ON "location"("state");

-- CreateIndex
CREATE INDEX "location_category_idx" ON "location"("category");
