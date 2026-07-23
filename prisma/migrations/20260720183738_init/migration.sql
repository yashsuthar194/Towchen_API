-- CreateEnum
CREATE TYPE "DispatchRoundStatus" AS ENUM ('Pending', 'Active', 'Skipped', 'Accepted');

-- CreateEnum
CREATE TYPE "ScheduledOrderStatus" AS ENUM ('Pending', 'Processing', 'Promoted', 'Failed', 'Cancelled', 'Expired');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('Enterprise', 'Basic');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "JourneyType" AS ENUM ('FourWay', 'ThreeWay');

-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD');

-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('Number', 'Email');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('Pending', 'Approved');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('Available', 'Busy', 'UnderApproval', 'Banned');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SuperAdmin', 'Admin', 'Vendor', 'Driver', 'Customer');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SoleProprietorship', 'Partnership', 'Corporation', 'LimitedLiabilityCompany', 'Cooperative');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('Upload', 'E_Sign');

-- CreateEnum
CREATE TYPE "LocationCategory" AS ENUM ('Driver', 'Order');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('New', 'Assigned', 'OtpPending', 'InProgress', 'Completed', 'Closed');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('Start', 'Breakdown', 'Drop', 'End');

-- CreateEnum
CREATE TYPE "OrderOtpType" AS ENUM ('BREAKDOWN', 'DROP');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('Available', 'Unavailable', 'Onboard Pending');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('Available', 'UnderApproval', 'Banned');

-- CreateTable
CREATE TABLE "vendor" (
    "id" SERIAL NOT NULL,
    "formated_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT true,
    "pan_card_url" TEXT NOT NULL,
    "gst_number" VARCHAR(15),
    "gst_certificate_url" TEXT NOT NULL,
    "approved_by" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "VendorStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted_by" INTEGER,
    "is_gst_vendor" BOOLEAN NOT NULL DEFAULT false,
    "is_number_verified" BOOLEAN NOT NULL DEFAULT true,
    "agreement_status" BOOLEAN NOT NULL DEFAULT false,
    "signature_url" TEXT,
    "alternate_number" VARCHAR(20) NOT NULL,
    "aadhar_card_url" TEXT NOT NULL,
    "mobile_number" VARCHAR(20) NOT NULL,
    "organization_certificate_url" TEXT NOT NULL,
    "organization_name" VARCHAR(255) NOT NULL,
    "organization_type" "OrganizationType" NOT NULL,
    "pan_number" VARCHAR(100) NOT NULL,
    "representative_designation" VARCHAR(100) NOT NULL,
    "representative_name" VARCHAR(255) NOT NULL,
    "signature_type" "SignatureType" NOT NULL,
    "vendor_name" VARCHAR(255) NOT NULL,
    "vendor_profile_image_url" TEXT NOT NULL,
    "service_ids" INTEGER[],

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_bank_detail" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passbook_or_cancel_check_url" TEXT NOT NULL,

    CONSTRAINT "vendor_bank_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp" (
    "number" VARCHAR(20),
    "otp" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "email" VARCHAR(255),
    "id" SERIAL NOT NULL,
    "type" "OtpType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_number_verified" BOOLEAN NOT NULL DEFAULT false,
    "pan_card_url" TEXT,
    "driver_license_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted_by" INTEGER,
    "status" "DriverStatus" NOT NULL DEFAULT 'Banned',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "formated_id" TEXT NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "vehicle_id" INTEGER,
    "alternate_mobile_number" VARCHAR(20) NOT NULL,
    "driver_name" VARCHAR(255) NOT NULL,
    "mobile_number" VARCHAR(20) NOT NULL,
    "aadhar_card_url" TEXT,
    "driver_image_url" TEXT,
    "end_location_id" INTEGER,
    "start_location_id" INTEGER,
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'Onboard Pending',
    "sub_service_id" INTEGER,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" SERIAL NOT NULL,
    "fleet_type" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "fleet_location" VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(20) NOT NULL,
    "make" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "owner_name" VARCHAR(255) NOT NULL,
    "chassis_number" VARCHAR(255) NOT NULL,
    "engine_number" VARCHAR(255) NOT NULL,
    "vehicle_validity" TIMESTAMP(3) NOT NULL,
    "insurance_validity" TIMESTAMP(3) NOT NULL,
    "fitness_validity" TIMESTAMP(3) NOT NULL,
    "puc_validity" TIMESTAMP(3) NOT NULL,
    "vehical_image_url" TEXT[],
    "chassis_image_url" TEXT,
    "tax_image_url" TEXT,
    "insurance_image_url" TEXT,
    "fitness_image_url" TEXT,
    "puc_image_url" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicle_class" VARCHAR(255),
    "status" "VehicleStatus" NOT NULL DEFAULT 'Banned',
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'Onboard Pending',

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" SERIAL NOT NULL,
    "formated_id" TEXT NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted_by" INTEGER,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_vehicle" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "make" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(20) NOT NULL,
    "class" VARCHAR(255) NOT NULL,
    "fuel_type" "FuelType" NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted_by" INTEGER,

    CONSTRAINT "customer_vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location" (
    "id" SERIAL NOT NULL,
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
    "description" TEXT,
    "place_id" TEXT NOT NULL,
    "category" "LocationCategory" NOT NULL DEFAULT 'Driver',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_address" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
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
    "description" TEXT,
    "place_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "number" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" SERIAL NOT NULL,
    "formated_id" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "customer_vehicle_id" INTEGER,
    "vendor_id" INTEGER,
    "driver_id" INTEGER,
    "vehicle_id" INTEGER,
    "service_id" INTEGER NOT NULL,
    "sub_service_id" INTEGER,
    "fleet_type" INTEGER NOT NULL,
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
    "applied_voucher_id" INTEGER,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "final_amount" DOUBLE PRECISION,
    "scheduled_order_id" INTEGER,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_location" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
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

    CONSTRAINT "order_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_otp" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "type" "OrderOtpType" NOT NULL DEFAULT 'BREAKDOWN',
    "otp" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_stamp" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "method" "HttpMethod" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "status_code" INTEGER NOT NULL,
    "res_time" INTEGER NOT NULL,
    "res_message" TEXT,
    "error" TEXT,
    "error_stack" TEXT,
    "req_body" JSONB,
    "req_query_params" JSONB,
    "req_header" JSONB,
    "req_files" JSONB,
    "req_content_type" TEXT,
    "res_body" JSONB,
    "raw_token" TEXT,
    "decoded_token" JSONB,
    "user_role" "Role",
    "user_id" INTEGER,
    "user_formated_id" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "endpoint_group" TEXT,
    "meta_data" JSONB,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_service" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "service_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fix_distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fix_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ton" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "journey_type" "JourneyType" NOT NULL DEFAULT 'FourWay',

    CONSTRAINT "sub_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_service_condtion" (
    "id" SERIAL NOT NULL,
    "sub_service_id" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_service_condtion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transaction" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transaction_type" "TransactionType" NOT NULL,
    "before_transaction_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "after_transaction_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "has_expired" BOOLEAN NOT NULL DEFAULT false,
    "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "used_by_id" INTEGER,
    "used_at" TIMESTAMP(3),
    "type" "VoucherType" NOT NULL DEFAULT 'Basic',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_order" (
    "id" SERIAL NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "status" "ScheduledOrderStatus" NOT NULL DEFAULT 'Pending',
    "payload" JSONB NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "last_attempted_at" TIMESTAMP(3),
    "last_error" TEXT,
    "promoted_order_id" INTEGER,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_dispatch" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "status" "DispatchRoundStatus" NOT NULL DEFAULT 'Pending',
    "notified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_evcrf" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
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

    CONSTRAINT "pickup_evcrf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_evcrf_damage" (
    "id" SERIAL NOT NULL,
    "pickup_evcrf_id" INTEGER NOT NULL,
    "damage_number" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_evcrf_damage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dropoff_evcrf" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
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

    CONSTRAINT "dropoff_evcrf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_class_configuration" (
    "id" SERIAL NOT NULL,
    "mapped_class" VARCHAR(255) NOT NULL,
    "sub_classes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "diagram_image_url" TEXT NOT NULL,
    "total_damage_points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_class_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_class_accessory" (
    "id" SERIAL NOT NULL,
    "vehicle_class_configuration_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_class_accessory_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "_serviceTovendor" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_serviceTovendor_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_formated_id_key" ON "vendor"("formated_id");

-- CreateIndex
CREATE INDEX "vendor_id_formated_id_idx" ON "vendor"("id", "formated_id");

-- CreateIndex
CREATE INDEX "vendor_email_is_deleted_idx" ON "vendor"("email", "is_deleted");

-- CreateIndex
CREATE INDEX "vendor_mobile_number_is_deleted_idx" ON "vendor"("mobile_number", "is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bank_detail_vendor_id_key" ON "vendor_bank_detail"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_bank_detail_vendor_id_idx" ON "vendor_bank_detail"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_formated_id_key" ON "driver"("formated_id");

-- CreateIndex
CREATE INDEX "driver_vendor_id_idx" ON "driver"("vendor_id");

-- CreateIndex
CREATE INDEX "driver_vehicle_id_idx" ON "driver"("vehicle_id");

-- CreateIndex
CREATE INDEX "driver_start_location_id_idx" ON "driver"("start_location_id");

-- CreateIndex
CREATE INDEX "driver_end_location_id_idx" ON "driver"("end_location_id");

-- CreateIndex
CREATE INDEX "driver_email_is_deleted_idx" ON "driver"("email", "is_deleted");

-- CreateIndex
CREATE INDEX "driver_mobile_number_is_deleted_idx" ON "driver"("mobile_number", "is_deleted");

-- CreateIndex
CREATE INDEX "vehicle_id_idx" ON "vehicle"("id");

-- CreateIndex
CREATE INDEX "vehicle_vendor_id_idx" ON "vehicle"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_formated_id_key" ON "customer"("formated_id");

-- CreateIndex
CREATE INDEX "customer_vehicle_customer_id_idx" ON "customer_vehicle"("customer_id");

-- CreateIndex
CREATE INDEX "location_city_idx" ON "location"("city");

-- CreateIndex
CREATE INDEX "location_state_idx" ON "location"("state");

-- CreateIndex
CREATE INDEX "location_category_idx" ON "location"("category");

-- CreateIndex
CREATE INDEX "location_place_id_idx" ON "location"("place_id");

-- CreateIndex
CREATE INDEX "customer_address_customer_id_idx" ON "customer_address"("customer_id");

-- CreateIndex
CREATE INDEX "customer_address_place_id_idx" ON "customer_address"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_formated_id_key" ON "order"("formated_id");

-- CreateIndex
CREATE INDEX "order_customer_id_idx" ON "order"("customer_id");

-- CreateIndex
CREATE INDEX "order_driver_id_idx" ON "order"("driver_id");

-- CreateIndex
CREATE INDEX "order_status_created_at_idx" ON "order"("status", "created_at");

-- CreateIndex
CREATE INDEX "order_vehicle_id_idx" ON "order"("vehicle_id");

-- CreateIndex
CREATE INDEX "order_vendor_id_idx" ON "order"("vendor_id");

-- CreateIndex
CREATE INDEX "order_applied_voucher_id_idx" ON "order"("applied_voucher_id");

-- CreateIndex
CREATE INDEX "order_scheduled_order_id_idx" ON "order"("scheduled_order_id");

-- CreateIndex
CREATE INDEX "order_location_order_id_idx" ON "order_location"("order_id");

-- CreateIndex
CREATE INDEX "order_location_place_id_idx" ON "order_location"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_location_order_id_type_key" ON "order_location"("order_id", "type");

-- CreateIndex
CREATE INDEX "order_otp_order_id_idx" ON "order_otp"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_otp_order_id_type_key" ON "order_otp"("order_id", "type");

-- CreateIndex
CREATE INDEX "logs_date_idx" ON "logs"("date");

-- CreateIndex
CREATE INDEX "logs_success_status_code_idx" ON "logs"("success", "status_code");

-- CreateIndex
CREATE INDEX "logs_user_id_user_role_idx" ON "logs"("user_id", "user_role");

-- CreateIndex
CREATE INDEX "logs_endpoint_group_idx" ON "logs"("endpoint_group");

-- CreateIndex
CREATE UNIQUE INDEX "service_name_key" ON "service"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_service_name_service_id_key" ON "sub_service"("name", "service_id");

-- CreateIndex
CREATE INDEX "sub_service_condtion_sub_service_id_idx" ON "sub_service_condtion"("sub_service_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_code_key" ON "voucher"("code");

-- CreateIndex
CREATE INDEX "voucher_user_id_idx" ON "voucher"("user_id");

-- CreateIndex
CREATE INDEX "voucher_used_by_id_idx" ON "voucher"("used_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_order_idempotency_key_key" ON "scheduled_order"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_order_promoted_order_id_key" ON "scheduled_order"("promoted_order_id");

-- CreateIndex
CREATE INDEX "scheduled_order_status_scheduled_at_idx" ON "scheduled_order"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "scheduled_order_customer_id_idx" ON "scheduled_order"("customer_id");

-- CreateIndex
CREATE INDEX "order_dispatch_order_id_rank_idx" ON "order_dispatch"("order_id", "rank");

-- CreateIndex
CREATE INDEX "order_dispatch_order_id_status_idx" ON "order_dispatch"("order_id", "status");

-- CreateIndex
CREATE INDEX "order_dispatch_status_expires_at_idx" ON "order_dispatch"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_evcrf_order_id_key" ON "pickup_evcrf"("order_id");

-- CreateIndex
CREATE INDEX "pickup_evcrf_order_id_idx" ON "pickup_evcrf"("order_id");

-- CreateIndex
CREATE INDEX "pickup_evcrf_vehicle_class_configuration_id_idx" ON "pickup_evcrf"("vehicle_class_configuration_id");

-- CreateIndex
CREATE INDEX "pickup_evcrf_damage_pickup_evcrf_id_idx" ON "pickup_evcrf_damage"("pickup_evcrf_id");

-- CreateIndex
CREATE UNIQUE INDEX "dropoff_evcrf_order_id_key" ON "dropoff_evcrf"("order_id");

-- CreateIndex
CREATE INDEX "dropoff_evcrf_order_id_idx" ON "dropoff_evcrf"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_class_configuration_mapped_class_key" ON "vehicle_class_configuration"("mapped_class");

-- CreateIndex
CREATE INDEX "vehicle_class_accessory_vehicle_class_configuration_id_idx" ON "vehicle_class_accessory"("vehicle_class_configuration_id");

-- CreateIndex
CREATE INDEX "vehicle_state_vehicle_class_configuration_id_idx" ON "vehicle_state"("vehicle_class_configuration_id");

-- CreateIndex
CREATE INDEX "vehicle_state_option_vehicle_state_id_idx" ON "vehicle_state_option"("vehicle_state_id");

-- CreateIndex
CREATE INDEX "_serviceTovendor_B_index" ON "_serviceTovendor"("B");

-- Create the function to generate formatted IDs
CREATE OR REPLACE FUNCTION generate_formatted_id()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
BEGIN
    -- Determine the prefix based on the table name
    CASE TG_TABLE_NAME
        WHEN 'vendor' THEN prefix := 'VND';
        WHEN 'driver' THEN prefix := 'DRV';
        WHEN 'customer' THEN prefix := 'CST';
        WHEN 'order' THEN prefix := 'ORD';
        ELSE prefix := 'UNK';
    END CASE;

    -- Ensure the ID is populated (if using SERIAL/SEQUENCE)
    IF NEW.id IS NULL THEN
        NEW.id := nextval(pg_get_serial_sequence(TG_TABLE_NAME, 'id'));
    END IF;

    -- Generate the formatted ID: Prefix + 7 digits (padded with zeros)
    NEW.formated_id := prefix || LPAD(NEW.id::text, 7, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they already exist (to avoid errors on re-run)
DROP TRIGGER IF EXISTS trg_vendor_formatted_id ON "vendor";
DROP TRIGGER IF EXISTS trg_driver_formatted_id ON "driver";
DROP TRIGGER IF EXISTS trg_customer_formatted_id ON "customer";
DROP TRIGGER IF EXISTS trg_order_formatted_id ON "order";

-- Create triggers
CREATE TRIGGER trg_vendor_formatted_id
BEFORE INSERT ON "vendor"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();

CREATE TRIGGER trg_driver_formatted_id
BEFORE INSERT ON "driver"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();

CREATE TRIGGER trg_customer_formatted_id
BEFORE INSERT ON "customer"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();

CREATE TRIGGER trg_order_formatted_id
BEFORE INSERT ON "order"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();

