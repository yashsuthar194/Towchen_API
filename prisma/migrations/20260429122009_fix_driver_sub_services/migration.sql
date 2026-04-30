/*
  Warnings:

  - You are about to drop the column `sub_service_id` on the `driver` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "driver" DROP COLUMN "sub_service_id",
ADD COLUMN     "sub_service_ids" INTEGER[];
