/*
  Warnings:

  - Changed the type of `fleet_type` on the `order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `fleet_type` on the `vehicle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "order" DROP COLUMN "fleet_type",
ADD COLUMN     "fleet_type" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "fleet_type",
ADD COLUMN     "fleet_type" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "FleetType";
