-- CreateTable
CREATE TABLE "vehicle_class_configuration" (
    "id" SERIAL NOT NULL,
    "mapped_class" VARCHAR(255) NOT NULL,
    "diagram_image_url" TEXT NOT NULL,
    "total_damage_points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_class_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_class_configuration_mapped_class_key" ON "vehicle_class_configuration"("mapped_class");
