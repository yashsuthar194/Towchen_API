/*
  Warnings:

  - You are about to drop the `vehicle_class_condition_group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle_class_condition_option` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "vehicle_class_condition_group";

-- DropTable
DROP TABLE "vehicle_class_condition_option";

-- CreateTable
CREATE TABLE "vehicle_state" (
    "id" SERIAL NOT NULL,
    "vehicle_class_configuration_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_state_option" (
    "id" SERIAL NOT NULL,
    "vehicle_state_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_state_option_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_state_vehicle_class_configuration_id_idx" ON "vehicle_state"("vehicle_class_configuration_id");

-- CreateIndex
CREATE INDEX "vehicle_state_option_vehicle_state_id_idx" ON "vehicle_state_option"("vehicle_state_id");
