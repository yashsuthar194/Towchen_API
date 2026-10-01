-- AlterTable
ALTER TABLE "dealer" 
ADD COLUMN "name" VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN "number" VARCHAR(20) NOT NULL DEFAULT '',
ADD COLUMN "alternative_number" VARCHAR(20),
ADD COLUMN "residential_address" VARCHAR(255),
ADD COLUMN "bank_name" VARCHAR(255),
ADD COLUMN "ifsc_code" VARCHAR(50) NOT NULL DEFAULT '',
ADD COLUMN "account_number" VARCHAR(50) NOT NULL DEFAULT '',
ADD COLUMN "account_holder_name" VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN "dealer_image" TEXT,
ADD COLUMN "aadhar_image" TEXT NOT NULL DEFAULT '',
ADD COLUMN "pan_image" TEXT NOT NULL DEFAULT '',
ADD COLUMN "bankdetails_image" TEXT;

-- Drop default constraints on required columns so future inserts must supply them
ALTER TABLE "dealer" 
ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "number" DROP DEFAULT,
ALTER COLUMN "ifsc_code" DROP DEFAULT,
ALTER COLUMN "account_number" DROP DEFAULT,
ALTER COLUMN "account_holder_name" DROP DEFAULT,
ALTER COLUMN "aadhar_image" DROP DEFAULT,
ALTER COLUMN "pan_image" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "dealer_number_is_deleted_idx" ON "dealer"("number", "is_deleted");
