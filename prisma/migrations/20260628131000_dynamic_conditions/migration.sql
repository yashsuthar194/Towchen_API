-- AlterTable
ALTER TABLE "pickup_e_job_card" ADD COLUMN "selected_conditions" JSONB;

-- CreateTable
CREATE TABLE "vehicle_class_condition_group" (
    "id" SERIAL NOT NULL,
    "vehicle_class_configuration_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_class_condition_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_class_condition_option" (
    "id" SERIAL NOT NULL,
    "condition_group_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_class_condition_option_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_class_condition_group_vehicle_class_configuration_id_idx" ON "vehicle_class_condition_group"("vehicle_class_configuration_id");

-- CreateIndex
CREATE INDEX "vehicle_class_condition_option_condition_group_id_idx" ON "vehicle_class_condition_option"("condition_group_id");
