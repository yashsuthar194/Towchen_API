-- CreateEnum
CREATE TYPE "VendorServices" AS ENUM ('ROS', 'Towing');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('Pending', 'Approved');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SuperAdmin', 'Admin', 'Vendor', 'Driver', 'Customer');

-- CreateTable
CREATE TABLE "vendor" (
    "id" SERIAL NOT NULL,
    "formated_id" TEXT NOT NULL DEFAULT 'TEMP',
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "vendor_image_url" TEXT NOT NULL,
    "services" "VendorServices"[],
    "pan_card_url" TEXT NOT NULL,
    "adhar_card_url" TEXT NOT NULL,
    "org_name" VARCHAR(255) NOT NULL,
    "org_number" VARCHAR(20) NOT NULL,
    "org_alternate_number" VARCHAR(20) NOT NULL,
    "org_email" VARCHAR(255) NOT NULL,
    "org_certificate_url" TEXT NOT NULL,
    "gst_number" VARCHAR(15) NOT NULL,
    "gst_certificate_url" TEXT NOT NULL,
    "approved_by" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "VendorStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- 1. Create the function
CREATE OR REPLACE FUNCTION set_vendor_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.formated_id := 'VEN' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
CREATE TRIGGER trg_set_vendor_display_id
BEFORE INSERT ON "vendor"
FOR EACH ROW EXECUTE FUNCTION set_vendor_display_id();


-- CreateTable
CREATE TABLE "vendor_bank_detail" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "detail_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_bank_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp" (
    "number" VARCHAR(20) NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_formated_id_key" ON "vendor"("formated_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_email_key" ON "vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_number_key" ON "vendor"("number");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_org_email_key" ON "vendor"("org_email");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_bank_detail_vendor_id_key" ON "vendor_bank_detail"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "otp_number_key" ON "otp"("number");
