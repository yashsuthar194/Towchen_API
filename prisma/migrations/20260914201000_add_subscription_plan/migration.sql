-- CreateTable
CREATE TABLE IF NOT EXISTS "subscription_plan" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "pricing" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "plan_period_months" INTEGER NOT NULL,
    "incidents" INTEGER NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
);

