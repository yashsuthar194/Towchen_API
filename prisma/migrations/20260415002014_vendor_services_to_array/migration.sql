-- AlterTable: vendor.services from single enum to array
-- Use USING clause to cast existing single values into an array
ALTER TABLE "vendor" ALTER COLUMN "services" DROP DEFAULT;
ALTER TABLE "vendor" ALTER COLUMN "services" SET DATA TYPE "VendorServices"[] USING ARRAY["services"]::"VendorServices"[];
