-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG');

-- AlterTable: convert fuel_type from VARCHAR to FuelType enum
-- Existing rows with values not matching the enum will fail; clean them up first if needed
ALTER TABLE "customer_vehicle"
  ALTER COLUMN "fuel_type" TYPE "FuelType" USING "fuel_type"::"FuelType";
