-- Migration: vendor.services changes from VendorServices[] (array) to VendorServices (single enum)
-- 
-- NOTE: Previous failed migration attempts may have left the DB in a partial state.
-- The vendor.services column may have been dropped by a CASCADE.
-- Since this is a fresh database with no data, we safely drop and recreate it.

-- Step 1: Cleanup leftover types from previous failed attempts (safe with IF EXISTS)
DROP TYPE IF EXISTS "VendorServices_new";
DROP TYPE IF EXISTS "VendorServices_old";

-- Step 2: Drop the services column on vendor (handles both array and missing states)
ALTER TABLE "vendor" DROP COLUMN IF EXISTS "services";

-- Step 3: Re-add services as a single VendorServices enum (not array)
ALTER TABLE "vendor" ADD COLUMN "services" "VendorServices" NOT NULL DEFAULT 'Towing';

-- Step 4: Drop the temporary default (no default in final schema)
ALTER TABLE "vendor" ALTER COLUMN "services" DROP DEFAULT;
