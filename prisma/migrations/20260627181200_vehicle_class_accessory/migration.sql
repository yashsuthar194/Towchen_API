-- AlterTable
ALTER TABLE "vehicle_class_configuration" DROP COLUMN "accessories";

-- CreateTable
CREATE TABLE "vehicle_class_accessory" (
    "id" SERIAL NOT NULL,
    "vehicle_class_configuration_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_class_accessory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_class_accessory_vehicle_class_configuration_id_idx" ON "vehicle_class_accessory"("vehicle_class_configuration_id");
