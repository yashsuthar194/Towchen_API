/*
  Warnings:

  - A unique constraint covering the columns `[formated_id]` on the table `driver` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `formated_id` to the `driver` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "driver" ADD COLUMN     "formated_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "driver_formated_id_key" ON "driver"("formated_id");
