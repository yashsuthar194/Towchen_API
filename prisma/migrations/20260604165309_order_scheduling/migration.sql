/*
  Warnings:

  - You are about to drop the column `location_id` on the `order_location` table. All the data in the column will be lost.
  - Added the required column `latitude` to the `order_location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `order_location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `place_id` to the `order_location` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ScheduledOrderStatus" AS ENUM ('Pending', 'Processing', 'Promoted', 'Failed', 'Cancelled', 'Expired');

-- DropIndex
DROP INDEX "order_location_location_id_idx";

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "scheduled_order_id" INTEGER;

-- AlterTable
ALTER TABLE "order_location" DROP COLUMN "location_id",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "area" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "landmark" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "place_id" TEXT NOT NULL,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT;

-- CreateTable
CREATE TABLE "scheduled_order" (
    "id" SERIAL NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "ScheduledOrderStatus" NOT NULL DEFAULT 'Pending',
    "payload" JSONB NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_attempted_at" TIMESTAMP(3),
    "last_error" TEXT,
    "promoted_order_id" INTEGER,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_order_idempotency_key_key" ON "scheduled_order"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_order_promoted_order_id_key" ON "scheduled_order"("promoted_order_id");

-- CreateIndex
CREATE INDEX "scheduled_order_status_scheduled_at_idx" ON "scheduled_order"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "scheduled_order_customer_id_idx" ON "scheduled_order"("customer_id");

-- CreateIndex
CREATE INDEX "order_scheduled_order_id_idx" ON "order"("scheduled_order_id");

-- CreateIndex
CREATE INDEX "order_location_place_id_idx" ON "order_location"("place_id");
