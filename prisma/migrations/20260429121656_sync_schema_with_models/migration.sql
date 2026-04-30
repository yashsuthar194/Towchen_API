/*
  Warnings:

  - You are about to drop the `_driverTosub_service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_serviceTovendor` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "driver" ADD COLUMN     "sub_service_id" INTEGER;

-- AlterTable
ALTER TABLE "vendor" ADD COLUMN     "service_ids" INTEGER[];

-- DropTable
DROP TABLE "_driverTosub_service";

-- DropTable
DROP TABLE "_serviceTovendor";
