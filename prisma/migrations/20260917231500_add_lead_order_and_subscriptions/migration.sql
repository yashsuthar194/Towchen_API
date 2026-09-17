-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('New', 'Booked', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('Pending', 'Completed', 'Failed');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PendingActivation', 'Active', 'Expired', 'Cancelled');

-- AlterEnum
BEGIN;
UPDATE "order" SET "type" = 'Standard' WHERE "type"::text = 'Lead';
CREATE TYPE "OrderType_new" AS ENUM ('Standard', 'Scheduled');
ALTER TABLE "public"."order" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "order" ALTER COLUMN "type" TYPE "OrderType_new" USING ("type"::text::"OrderType_new");
ALTER TYPE "OrderType" RENAME TO "OrderType_old";
ALTER TYPE "OrderType_new" RENAME TO "OrderType";
DROP TYPE "public"."OrderType_old";
ALTER TABLE "order" ALTER COLUMN "type" SET DEFAULT 'Standard';
COMMIT;

-- DropIndex
DROP INDEX IF EXISTS "order_lead_id_key";

-- AlterTable
ALTER TABLE "lead" DROP COLUMN IF EXISTS "activation_time",
DROP COLUMN IF EXISTS "dispatch_type",
ADD COLUMN IF NOT EXISTS "lead_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS "status" "LeadStatus" NOT NULL DEFAULT 'New';

-- AlterTable
ALTER TABLE "order" DROP COLUMN IF EXISTS "lead_id";

-- AlterTable
ALTER TABLE "subscription_plan" ADD COLUMN IF NOT EXISTS "activation_delay_days" INTEGER NOT NULL DEFAULT 3;

-- DropEnum
DROP TYPE IF EXISTS "LeadDispatchType";

-- CreateTable
CREATE TABLE "lead_order" (
    "id" SERIAL NOT NULL,
    "formated_id" TEXT NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "driver_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "sub_service_id" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'New',
    "assign_time" TIMESTAMP(3),
    "start_time" TIMESTAMP(3),
    "completion_time" TIMESTAMP(3),
    "remarks" TEXT,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta_data" JSONB,
    "pre_booked_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pre_pickup_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "post_pickup_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dropoff_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_physical_vcrf_for_pickup" BOOLEAN NOT NULL DEFAULT true,
    "is_physical_vcrf_for_dropoff" BOOLEAN NOT NULL DEFAULT true,
    "physical_pickup_vcrf_image" TEXT,
    "physical_dropoff_vcrf_image" TEXT,

    CONSTRAINT "lead_order_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "lead_pickup_evcrf" (
    "id" SERIAL NOT NULL,
    "lead_order_id" INTEGER NOT NULL,
    "fuel_amount" VARCHAR(50),
    "odometer_reading_text" VARCHAR(100),
    "odometer_image" TEXT,
    "driver_image" TEXT,
    "driver_sign" TEXT,
    "remarks" TEXT,
    "selected_accessories" JSONB,
    "date_and_time" VARCHAR(255),
    "service_type" VARCHAR(255),
    "vehicle_brand" VARCHAR(255),
    "vehicle_model" VARCHAR(255),
    "vehicle_no" VARCHAR(255),
    "customer_ph_no" VARCHAR(50),
    "driver_name" VARCHAR(255),
    "driver_ph_no" VARCHAR(50),
    "reaching_date_and_time" VARCHAR(255),
    "event_type" VARCHAR(255),
    "event_location" VARCHAR(255),
    "vehicle_state" JSONB,
    "meta" JSONB,
    "vehicle_class_configuration_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_pickup_evcrf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_pickup_evcrf_damage" (
    "id" SERIAL NOT NULL,
    "lead_pickup_evcrf_id" INTEGER NOT NULL,
    "damage_number" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_pickup_evcrf_damage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_dropoff_evcrf" (
    "id" SERIAL NOT NULL,
    "lead_order_id" INTEGER NOT NULL,
    "remarks" TEXT,
    "handover_name" VARCHAR(255),
    "drop_location" VARCHAR(255),
    "droping_type" VARCHAR(255),
    "dropping_date_and_time" VARCHAR(255),
    "handover_image" TEXT,
    "handover_signature" TEXT,
    "dynamic_fields" JSONB,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_dropoff_evcrf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_order_otp" (
    "id" SERIAL NOT NULL,
    "lead_order_id" INTEGER NOT NULL,
    "type" "OrderOtpType" NOT NULL DEFAULT 'BREAKDOWN',
    "otp" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_order_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_order_location" (
    "id" SERIAL NOT NULL,
    "lead_order_id" INTEGER NOT NULL,
    "type" "LocationType" NOT NULL,
    "address" TEXT,
    "street" TEXT,
    "area" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "landmark" TEXT,
    "place_id" TEXT NOT NULL,
    "contact_name" VARCHAR(255),
    "contact_number" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_order_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_review" (
    "id" SERIAL NOT NULL,
    "lead_order_id" INTEGER NOT NULL,
    "reviewer_type" "ReviewUserType" NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "reviewee_type" "ReviewUserType" NOT NULL,
    "reviewee_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(150),
    "comment" TEXT,
    "tags" JSONB,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_order_formated_id_key" ON "lead_order"("formated_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_order_lead_id_key" ON "lead_order"("lead_id");

-- CreateIndex
CREATE INDEX "lead_order_lead_id_idx" ON "lead_order"("lead_id");

-- CreateIndex
CREATE INDEX "lead_order_customer_id_idx" ON "lead_order"("customer_id");

-- CreateIndex
CREATE INDEX "lead_order_vendor_id_idx" ON "lead_order"("vendor_id");

-- CreateIndex
CREATE INDEX "lead_order_driver_id_idx" ON "lead_order"("driver_id");

-- CreateIndex
CREATE INDEX "lead_order_vehicle_id_idx" ON "lead_order"("vehicle_id");

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

-- CreateIndex
CREATE UNIQUE INDEX "lead_pickup_evcrf_lead_order_id_key" ON "lead_pickup_evcrf"("lead_order_id");

-- CreateIndex
CREATE INDEX "lead_pickup_evcrf_lead_order_id_idx" ON "lead_pickup_evcrf"("lead_order_id");

-- CreateIndex
CREATE INDEX "lead_pickup_evcrf_vehicle_class_configuration_id_idx" ON "lead_pickup_evcrf"("vehicle_class_configuration_id");

-- CreateIndex
CREATE INDEX "lead_pickup_evcrf_damage_lead_pickup_evcrf_id_idx" ON "lead_pickup_evcrf_damage"("lead_pickup_evcrf_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_dropoff_evcrf_lead_order_id_key" ON "lead_dropoff_evcrf"("lead_order_id");

-- CreateIndex
CREATE INDEX "lead_dropoff_evcrf_lead_order_id_idx" ON "lead_dropoff_evcrf"("lead_order_id");

-- CreateIndex
CREATE INDEX "lead_order_otp_lead_order_id_idx" ON "lead_order_otp"("lead_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_order_otp_lead_order_id_type_key" ON "lead_order_otp"("lead_order_id", "type");

-- CreateIndex
CREATE INDEX "lead_order_location_lead_order_id_idx" ON "lead_order_location"("lead_order_id");

-- CreateIndex
CREATE INDEX "lead_order_location_place_id_idx" ON "lead_order_location"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_order_location_lead_order_id_type_key" ON "lead_order_location"("lead_order_id", "type");

-- CreateIndex
CREATE INDEX "lead_review_lead_order_id_idx" ON "lead_review"("lead_order_id");

-- CreateIndex
CREATE INDEX "lead_review_reviewee_type_reviewee_id_idx" ON "lead_review"("reviewee_type", "reviewee_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_review_lead_order_id_reviewer_type_reviewer_id_key" ON "lead_review"("lead_order_id", "reviewer_type", "reviewer_id");

-- Formatted ID Trigger for lead_order
CREATE OR REPLACE FUNCTION generate_formatted_id()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
BEGIN
    CASE TG_TABLE_NAME
        WHEN 'vendor' THEN prefix := 'VND';
        WHEN 'driver' THEN prefix := 'DRV';
        WHEN 'customer' THEN prefix := 'CST';
        WHEN 'order' THEN prefix := 'ORD';
        WHEN 'lead' THEN prefix := 'LED';
        WHEN 'lead_order' THEN prefix := 'LDO';
        ELSE prefix := 'UNK';
    END CASE;

    IF NEW.id IS NULL THEN
        NEW.id := nextval(pg_get_serial_sequence(TG_TABLE_NAME, 'id'));
    END IF;

    NEW.formated_id := prefix || LPAD(NEW.id::text, 7, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_order_formatted_id ON "lead_order";
CREATE TRIGGER trg_lead_order_formatted_id
BEFORE INSERT ON "lead_order"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();
