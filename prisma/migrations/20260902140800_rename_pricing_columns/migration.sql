-- Rename columns in sub_service
ALTER TABLE "sub_service" RENAME COLUMN "fix_distance" TO "base_distance";
ALTER TABLE "sub_service" RENAME COLUMN "fix_price" TO "base_price";
ALTER TABLE "sub_service" RENAME COLUMN "extra_price" TO "extra_distance_price";

-- Rename columns in location_pricing
ALTER TABLE "location_pricing" RENAME COLUMN "fix_distance" TO "base_distance";
ALTER TABLE "location_pricing" RENAME COLUMN "fix_price" TO "base_price";
ALTER TABLE "location_pricing" RENAME COLUMN "extra_price" TO "extra_distance_price";

-- Rename columns in vendor_pricing
ALTER TABLE "vendor_pricing" RENAME COLUMN "fix_price" TO "base_price";
ALTER TABLE "vendor_pricing" RENAME COLUMN "extra_price" TO "extra_distance_price";
