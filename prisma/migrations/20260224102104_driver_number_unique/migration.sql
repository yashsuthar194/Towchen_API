/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `driver` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "driver_number_key" ON "driver"("number");
