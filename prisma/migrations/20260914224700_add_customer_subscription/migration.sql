-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('Pending', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PendingActivation', 'Active', 'Expired', 'Cancelled');

-- CreateTable
CREATE TABLE "subscription_plan" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "pricing" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "plan_period_months" INTEGER NOT NULL,
    "incidents" INTEGER NOT NULL,
    "distance_km" DOUBLE PRECISION NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "activation_delay_days" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_subscription_purchase" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_subscription_purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_vehicle_subscription" (
    "id" SERIAL NOT NULL,
    "purchase_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "customer_vehicle_id" INTEGER NOT NULL,
    "subscription_plan_id" INTEGER NOT NULL,
    "rc_book_url" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "plan_pricing" DOUBLE PRECISION NOT NULL,
    "plan_period_months" INTEGER NOT NULL,
    "total_incidents_allowed" INTEGER NOT NULL,
    "distance_km_allowed" DOUBLE PRECISION NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PendingActivation',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_vehicle_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_incident_usage" (
    "id" SERIAL NOT NULL,
    "customer_vehicle_subscription_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_incident_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_subscription_purchase_customer_id_idx" ON "customer_subscription_purchase"("customer_id");

-- CreateIndex
CREATE INDEX "customer_vehicle_subscription_purchase_id_idx" ON "customer_vehicle_subscription"("purchase_id");

-- CreateIndex
CREATE INDEX "customer_vehicle_subscription_customer_id_idx" ON "customer_vehicle_subscription"("customer_id");

-- CreateIndex
CREATE INDEX "customer_vehicle_subscription_customer_vehicle_id_idx" ON "customer_vehicle_subscription"("customer_vehicle_id");

-- CreateIndex
CREATE INDEX "customer_vehicle_subscription_subscription_plan_id_idx" ON "customer_vehicle_subscription"("subscription_plan_id");

-- CreateIndex
CREATE INDEX "subscription_incident_usage_customer_vehicle_subscription_i_idx" ON "subscription_incident_usage"("customer_vehicle_subscription_id");

-- CreateIndex
CREATE INDEX "subscription_incident_usage_order_id_idx" ON "subscription_incident_usage"("order_id");

