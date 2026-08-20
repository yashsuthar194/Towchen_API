-- AlterTable
ALTER TABLE "driver" ADD COLUMN "service_location_id" INTEGER;

-- AlterTable
ALTER TABLE "vendor_pricing" ADD COLUMN "location_id" INTEGER;

-- Data Migration: Copy vendor's location_id into driver's service_location_id
UPDATE "driver" 
SET "service_location_id" = "vendor"."location_id" 
FROM "vendor" 
WHERE "driver"."vendor_id" = "vendor"."id" AND "vendor"."location_id" IS NOT NULL;

-- Data Migration: Copy vendor's location_id into vendor_pricing's location_id
UPDATE "vendor_pricing" 
SET "location_id" = "vendor"."location_id" 
FROM "vendor" 
WHERE "vendor_pricing"."vendor_id" = "vendor"."id" AND "vendor"."location_id" IS NOT NULL;

-- Clean up any orphaned vendor_pricing rows that didn't get a location_id (should be none)
DELETE FROM "vendor_pricing" WHERE "location_id" IS NULL;

-- AlterColumn: Make location_id NOT NULL in vendor_pricing
ALTER TABLE "vendor_pricing" ALTER COLUMN "location_id" SET NOT NULL;

-- DropIndex: Drop the old unique constraint
DROP INDEX "vendor_pricing_vendor_id_sub_service_id_key";

-- CreateIndex: Create the new unique constraint including location_id
CREATE UNIQUE INDEX "vendor_pricing_vendor_id_location_id_sub_service_id_key" ON "vendor_pricing"("vendor_id", "location_id", "sub_service_id");

-- CreateIndex
CREATE INDEX "driver_service_location_id_idx" ON "driver"("service_location_id");

-- CreateIndex
CREATE INDEX "vendor_pricing_location_id_idx" ON "vendor_pricing"("location_id");

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_service_location_id_fkey" FOREIGN KEY ("service_location_id") REFERENCES "location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_pricing" ADD CONSTRAINT "vendor_pricing_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
