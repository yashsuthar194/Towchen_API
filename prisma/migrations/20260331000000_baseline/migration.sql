-- ============================================================
-- BASELINE MIGRATION — squashed from all previous migrations
-- Reflects the exact state of prisma/schema.prisma as of 2026-03-31
-- ============================================================

-- -------------------------------------------------------
-- ENUMS
-- -------------------------------------------------------

CREATE TYPE "VendorServices" AS ENUM ('Towing', 'Technician', 'Custody', 'Hydra');

CREATE TYPE "VendorStatus" AS ENUM ('Pending', 'Approved');

CREATE TYPE "OtpType" AS ENUM ('Number', 'Email');

CREATE TYPE "DriverStatus" AS ENUM ('Available', 'Busy', 'UnderApproval', 'Banned');

CREATE TYPE "FleetType" AS ENUM ('Flatbed', 'UnderLift', 'ZeroDegree', 'TwoWFlatbed', 'Hydra');

CREATE TYPE "FuelType" AS ENUM ('Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid', 'LPG');

CREATE TYPE "Role" AS ENUM ('SuperAdmin', 'Admin', 'Vendor', 'Driver', 'Customer');

CREATE TYPE "OrganizationType" AS ENUM ('SoleProprietorship', 'Partnership', 'Corporation', 'LimitedLiabilityCompany', 'Cooperative');

CREATE TYPE "SignatureType" AS ENUM ('Upload', 'E_Sign');

CREATE TYPE "LocationCategory" AS ENUM ('Driver', 'Order');

CREATE TYPE "LocationType" AS ENUM ('Start', 'Breakdown', 'Drop', 'End');

CREATE TYPE "OrderOtpType" AS ENUM ('START', 'COMPLETE');

CREATE TYPE "OrderStatus" AS ENUM ('New', 'Assigned', 'InProgress', 'Completed', 'Closed', 'OtpPending');

-- -------------------------------------------------------
-- TABLES
-- -------------------------------------------------------

-- vendor
CREATE TABLE "vendor" (
    "id"                           SERIAL          NOT NULL,
    "formated_id"                  TEXT            NOT NULL,
    "email"                        VARCHAR(255)    NOT NULL,
    "password"                     VARCHAR(255)    NOT NULL,
    "is_email_verified"            BOOLEAN         NOT NULL DEFAULT true,
    "services"                     "VendorServices"[],
    "pan_card_url"                 TEXT            NOT NULL,
    "gst_number"                   VARCHAR(15),
    "gst_certificate_url"          TEXT            NOT NULL,
    "approved_by"                  INTEGER,
    "is_deleted"                   BOOLEAN         NOT NULL DEFAULT false,
    "status"                       "VendorStatus"  NOT NULL DEFAULT 'Pending',
    "created_at"                   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted_by"                INTEGER,
    "is_gst_vendor"                BOOLEAN         NOT NULL DEFAULT false,
    "is_number_verified"           BOOLEAN         NOT NULL DEFAULT true,
    "agreement_status"             BOOLEAN         NOT NULL DEFAULT false,
    "signature_url"                TEXT,
    "alternate_number"             VARCHAR(20)     NOT NULL,
    "aadhar_card_url"              TEXT            NOT NULL,
    "mobile_number"                VARCHAR(20)     NOT NULL,
    "organization_certificate_url" TEXT            NOT NULL,
    "organization_name"            VARCHAR(255)    NOT NULL,
    "organization_type"            "OrganizationType" NOT NULL,
    "pan_number"                   VARCHAR(100)    NOT NULL,
    "representative_designation"   VARCHAR(100)    NOT NULL,
    "representative_name"          VARCHAR(255)    NOT NULL,
    "signature_type"               "SignatureType" NOT NULL,
    "vendor_name"                  VARCHAR(255)    NOT NULL,
    "vendor_profile_image_url"     TEXT            NOT NULL,

    CONSTRAINT "vendor_pkey" PRIMARY KEY ("id")
);

-- vendor_bank_detail
CREATE TABLE "vendor_bank_detail" (
    "id"                           SERIAL       NOT NULL,
    "vendor_id"                    INTEGER      NOT NULL,
    "account_number"               TEXT         NOT NULL,
    "ifsc_code"                    TEXT         NOT NULL,
    "bank_name"                    TEXT         NOT NULL,
    "branch_name"                  TEXT         NOT NULL,
    "account_holder_name"          TEXT         NOT NULL,
    "created_at"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passbook_or_cancel_check_url" TEXT         NOT NULL,

    CONSTRAINT "vendor_bank_detail_pkey" PRIMARY KEY ("id")
);

-- otp
CREATE TABLE "otp" (
    "number"     VARCHAR(20),
    "otp"        VARCHAR(6)   NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "email"      VARCHAR(255),
    "id"         SERIAL       NOT NULL,
    "type"       "OtpType"    NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- location (renamed from driver_location)
CREATE TABLE "location" (
    "id"          SERIAL              NOT NULL,
    "address"     TEXT,
    "street"      TEXT,
    "area"        TEXT,
    "city"        TEXT,
    "state"       TEXT,
    "pincode"     TEXT,
    "country"     TEXT,
    "latitude"    DOUBLE PRECISION    NOT NULL,
    "longitude"   DOUBLE PRECISION    NOT NULL,
    "landmark"    TEXT,
    "description" TEXT,
    "category"    "LocationCategory"  NOT NULL DEFAULT 'Driver',
    "created_at"  TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

-- driver
CREATE TABLE "driver" (
    "id"                      SERIAL           NOT NULL,
    "email"                   VARCHAR(255)     NOT NULL,
    "password"                VARCHAR(255)     NOT NULL,
    "is_email_verified"       BOOLEAN          NOT NULL DEFAULT false,
    "is_number_verified"      BOOLEAN          NOT NULL DEFAULT false,
    "pan_card_url"            TEXT,
    "driver_license_url"      TEXT,
    "created_at"              TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted"              BOOLEAN          NOT NULL DEFAULT false,
    "is_deleted_by"           INTEGER,
    "status"                  "DriverStatus"   NOT NULL DEFAULT 'Banned',
    "services"                "VendorServices"[],
    "updated_at"              TIMESTAMP(3)     NOT NULL,
    "formated_id"             TEXT             NOT NULL,
    "vendor_id"               INTEGER          NOT NULL,
    "vehicle_id"              INTEGER,
    "alternate_mobile_number" VARCHAR(20)      NOT NULL,
    "driver_name"             VARCHAR(255)     NOT NULL,
    "mobile_number"           VARCHAR(20)      NOT NULL,
    "aadhar_card_url"         TEXT,
    "driver_image_url"        TEXT,
    "end_location_id"         INTEGER,
    "start_location_id"       INTEGER,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("id")
);

-- vehicle
CREATE TABLE "vehicle" (
    "id"                  SERIAL       NOT NULL,
    "fleet_type"          "FleetType"  NOT NULL,
    "vendor_id"           INTEGER      NOT NULL,
    "fleet_location"      VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(20)  NOT NULL,
    "make"                VARCHAR(255) NOT NULL,
    "model"               VARCHAR(255) NOT NULL,
    "owner_name"          VARCHAR(255) NOT NULL,
    "chassis_number"      VARCHAR(255) NOT NULL,
    "engine_number"       VARCHAR(255) NOT NULL,
    "vehicle_validity"    TIMESTAMP(3) NOT NULL,
    "insurance_validity"  TIMESTAMP(3) NOT NULL,
    "fitness_validity"    TIMESTAMP(3) NOT NULL,
    "puc_validity"        TIMESTAMP(3) NOT NULL,
    "vehical_image_url"   TEXT[],
    "chassis_image_url"   TEXT[],
    "tax_image_url"       TEXT[],
    "insurance_image_url" TEXT[],
    "fitness_image_url"   TEXT[],
    "puc_image_url"       TEXT[],
    "is_deleted"          BOOLEAN      NOT NULL DEFAULT false,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- customer
CREATE TABLE "customer" (
    "id"           SERIAL       NOT NULL,
    "formated_id"  TEXT         NOT NULL,
    "full_name"    VARCHAR(255) NOT NULL,
    "is_verified"  BOOLEAN      NOT NULL DEFAULT false,
    "number"       VARCHAR(20)  NOT NULL,
    "email"        VARCHAR(255) NOT NULL,
    "is_deleted"   BOOLEAN      NOT NULL DEFAULT false,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted_by" INTEGER,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- customer_vehicle
CREATE TABLE "customer_vehicle" (
    "id"                  SERIAL       NOT NULL,
    "customer_id"         INTEGER      NOT NULL,
    "make"                VARCHAR(255) NOT NULL,
    "model"               VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(20)  NOT NULL,
    "class"               VARCHAR(255) NOT NULL,
    "fuel_type"           "FuelType"   NOT NULL,
    "is_deleted"          BOOLEAN      NOT NULL DEFAULT false,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted_by"       INTEGER,

    CONSTRAINT "customer_vehicle_pkey" PRIMARY KEY ("id")
);

-- order
CREATE TABLE "order" (
    "id"                  SERIAL          NOT NULL,
    "formated_id"         TEXT            NOT NULL,
    "customer_id"         INTEGER         NOT NULL,
    "customer_vehicle_id" INTEGER,
    "vendor_id"           INTEGER,
    "driver_id"           INTEGER,
    "vehicle_id"          INTEGER,
    "service_type"        "VendorServices" NOT NULL,
    "fleet_type"          "FleetType"     NOT NULL,
    "status"              "OrderStatus"   NOT NULL DEFAULT 'New',
    "assign_time"         TIMESTAMP(3),
    "start_time"          TIMESTAMP(3),
    "completion_time"     TIMESTAMP(3),
    "remarks"             TEXT,
    "cancel_reason"       TEXT,
    "created_at"          TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- order_location
CREATE TABLE "order_location" (
    "id"             SERIAL         NOT NULL,
    "order_id"       INTEGER        NOT NULL,
    "location_id"    INTEGER        NOT NULL,
    "type"           "LocationType" NOT NULL,
    "created_at"     TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contact_name"   VARCHAR(255),
    "contact_number" VARCHAR(20),

    CONSTRAINT "order_location_pkey" PRIMARY KEY ("id")
);

-- order_otp
CREATE TABLE "order_otp" (
    "id"          SERIAL          NOT NULL,
    "order_id"    INTEGER         NOT NULL,
    "type"        "OrderOtpType"  NOT NULL DEFAULT 'START',
    "otp"         VARCHAR(6)      NOT NULL,
    "expires_at"  TIMESTAMP(3)    NOT NULL,
    "verified_at" TIMESTAMP(3),
    "is_verified" BOOLEAN         NOT NULL DEFAULT false,
    "attempts"    INTEGER         NOT NULL DEFAULT 0,
    "created_at"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3)    NOT NULL,

    CONSTRAINT "order_otp_pkey" PRIMARY KEY ("id")
);

-- -------------------------------------------------------
-- UNIQUE INDEXES
-- -------------------------------------------------------

CREATE UNIQUE INDEX "vendor_formated_id_key"          ON "vendor"("formated_id");
CREATE UNIQUE INDEX "vendor_bank_detail_vendor_id_key" ON "vendor_bank_detail"("vendor_id");
CREATE UNIQUE INDEX "driver_formated_id_key"           ON "driver"("formated_id");
CREATE UNIQUE INDEX "customer_formated_id_key"         ON "customer"("formated_id");
CREATE UNIQUE INDEX "order_formated_id_key"            ON "order"("formated_id");
CREATE UNIQUE INDEX "order_location_order_id_type_key" ON "order_location"("order_id", "type");
CREATE UNIQUE INDEX "order_otp_order_id_type_key"      ON "order_otp"("order_id", "type");

-- -------------------------------------------------------
-- PERFORMANCE (NON-UNIQUE) INDEXES
-- -------------------------------------------------------

-- vendor
CREATE INDEX "vendor_id_formated_id_idx"           ON "vendor"("id", "formated_id");
CREATE INDEX "vendor_email_is_deleted_idx"          ON "vendor"("email", "is_deleted");
CREATE INDEX "vendor_mobile_number_is_deleted_idx"  ON "vendor"("mobile_number", "is_deleted");

-- vendor_bank_detail
CREATE INDEX "vendor_bank_detail_vendor_id_idx"    ON "vendor_bank_detail"("vendor_id");

-- driver
CREATE INDEX "driver_vendor_id_idx"                ON "driver"("vendor_id");
CREATE INDEX "driver_vehicle_id_idx"               ON "driver"("vehicle_id");
CREATE INDEX "driver_start_location_id_idx"        ON "driver"("start_location_id");
CREATE INDEX "driver_end_location_id_idx"          ON "driver"("end_location_id");
CREATE INDEX "driver_email_is_deleted_idx"         ON "driver"("email", "is_deleted");
CREATE INDEX "driver_mobile_number_is_deleted_idx" ON "driver"("mobile_number", "is_deleted");

-- vehicle
CREATE INDEX "vehicle_id_idx"                      ON "vehicle"("id");
CREATE INDEX "vehicle_vendor_id_idx"               ON "vehicle"("vendor_id");

-- customer_vehicle
CREATE INDEX "customer_vehicle_customer_id_idx"    ON "customer_vehicle"("customer_id");

-- location
CREATE INDEX "location_city_idx"                   ON "location"("city");
CREATE INDEX "location_state_idx"                  ON "location"("state");
CREATE INDEX "location_category_idx"               ON "location"("category");

-- order
CREATE INDEX "order_customer_id_idx"               ON "order"("customer_id");
CREATE INDEX "order_driver_id_idx"                 ON "order"("driver_id");
CREATE INDEX "order_status_created_at_idx"         ON "order"("status", "created_at");
CREATE INDEX "order_vehicle_id_idx"                ON "order"("vehicle_id");
CREATE INDEX "order_vendor_id_idx"                 ON "order"("vendor_id");

-- order_location
CREATE INDEX "order_location_location_id_idx"      ON "order_location"("location_id");
CREATE INDEX "order_location_order_id_idx"         ON "order_location"("order_id");

-- order_otp
CREATE INDEX "order_otp_order_id_idx"              ON "order_otp"("order_id");

-- -------------------------------------------------------
-- TRIGGER FUNCTIONS & TRIGGERS (manual SQL — preserved from original migrations)
-- -------------------------------------------------------

-- Vendor: auto-generate formated_id as 'VEN0000001'
CREATE OR REPLACE FUNCTION set_vendor_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.formated_id := 'VND' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_vendor_display_id ON "vendor";
CREATE TRIGGER trg_set_vendor_display_id
BEFORE INSERT ON "vendor"
FOR EACH ROW EXECUTE FUNCTION set_vendor_display_id();

-- Driver: auto-generate formated_id as 'DRI0000001'
CREATE OR REPLACE FUNCTION set_driver_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.formated_id := 'DRV' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_driver_display_id ON "driver";
CREATE TRIGGER trg_set_driver_display_id
BEFORE INSERT ON "driver"
FOR EACH ROW EXECUTE FUNCTION set_driver_display_id();

-- Customer: auto-generate formated_id as 'CUST0000001'
CREATE OR REPLACE FUNCTION set_customer_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.formated_id := 'CST' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_customer_display_id ON "customer";
CREATE TRIGGER trg_set_customer_display_id
BEFORE INSERT ON "customer"
FOR EACH ROW EXECUTE FUNCTION set_customer_display_id();
