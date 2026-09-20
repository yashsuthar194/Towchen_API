-- DropIndex
DROP INDEX IF EXISTS "lead_dropoff_evcrf_lead_order_id_idx";
DROP INDEX IF EXISTS "lead_dropoff_evcrf_lead_order_id_key";
DROP INDEX IF EXISTS "lead_pickup_evcrf_lead_order_id_idx";
DROP INDEX IF EXISTS "lead_pickup_evcrf_lead_order_id_key";
DROP INDEX IF EXISTS "lead_review_lead_order_id_idx";
DROP INDEX IF EXISTS "lead_review_lead_order_id_reviewer_type_reviewer_id_key";

-- AlterTable
ALTER TABLE "lead" ADD COLUMN IF NOT EXISTS "assign_time" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "cancel_reason" TEXT,
ADD COLUMN IF NOT EXISTS "completion_time" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "customer_id" INTEGER,
ADD COLUMN IF NOT EXISTS "dropoff_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "is_physical_vcrf_for_dropoff" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "is_physical_vcrf_for_pickup" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "meta_data" JSONB,
ADD COLUMN IF NOT EXISTS "order_formated_id" TEXT,
ADD COLUMN IF NOT EXISTS "order_status" "OrderStatus",
ADD COLUMN IF NOT EXISTS "physical_dropoff_vcrf_image" TEXT,
ADD COLUMN IF NOT EXISTS "physical_pickup_vcrf_image" TEXT,
ADD COLUMN IF NOT EXISTS "post_pickup_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "pre_booked_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "pre_pickup_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "remarks" TEXT,
ADD COLUMN IF NOT EXISTS "start_time" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "lead_dropoff_evcrf" DROP COLUMN IF EXISTS "lead_order_id",
ADD COLUMN IF NOT EXISTS "lead_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "lead_pickup_evcrf" DROP COLUMN IF EXISTS "lead_order_id",
ADD COLUMN IF NOT EXISTS "lead_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "lead_review" DROP COLUMN IF EXISTS "lead_order_id",
ADD COLUMN IF NOT EXISTS "lead_id" INTEGER NOT NULL;

-- Drop trigger on lead_order
DROP TRIGGER IF EXISTS trg_lead_order_formatted_id ON "lead_order";

-- DropTable
DROP TABLE IF EXISTS "lead_order";
DROP TABLE IF EXISTS "lead_order_location";
DROP TABLE IF EXISTS "lead_order_otp";

-- CreateTable
CREATE TABLE IF NOT EXISTS "lead_otp" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "type" "OrderOtpType" NOT NULL DEFAULT 'BREAKDOWN',
    "otp" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "lead_location" (
    "id" SERIAL NOT NULL,
    "lead_id" INTEGER NOT NULL,
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

    CONSTRAINT "lead_location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lead_otp_lead_id_idx" ON "lead_otp"("lead_id");
CREATE UNIQUE INDEX IF NOT EXISTS "lead_otp_lead_id_type_key" ON "lead_otp"("lead_id", "type");
CREATE INDEX IF NOT EXISTS "lead_location_lead_id_idx" ON "lead_location"("lead_id");
CREATE INDEX IF NOT EXISTS "lead_location_place_id_idx" ON "lead_location"("place_id");
CREATE UNIQUE INDEX IF NOT EXISTS "lead_location_lead_id_type_key" ON "lead_location"("lead_id", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "lead_order_formated_id_key" ON "lead"("order_formated_id");
CREATE INDEX IF NOT EXISTS "lead_customer_id_idx" ON "lead"("customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "lead_dropoff_evcrf_lead_id_key" ON "lead_dropoff_evcrf"("lead_id");
CREATE INDEX IF NOT EXISTS "lead_dropoff_evcrf_lead_id_idx" ON "lead_dropoff_evcrf"("lead_id");
CREATE UNIQUE INDEX IF NOT EXISTS "lead_pickup_evcrf_lead_id_key" ON "lead_pickup_evcrf"("lead_id");
CREATE INDEX IF NOT EXISTS "lead_pickup_evcrf_lead_id_idx" ON "lead_pickup_evcrf"("lead_id");
CREATE INDEX IF NOT EXISTS "lead_review_lead_id_idx" ON "lead_review"("lead_id");
CREATE UNIQUE INDEX IF NOT EXISTS "lead_review_lead_id_reviewer_type_reviewer_id_key" ON "lead_review"("lead_id", "reviewer_type", "reviewer_id");
