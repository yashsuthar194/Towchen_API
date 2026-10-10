-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('NewOrder', 'ManualOrderAssign', 'OrderEdit', 'OrderClosure', 'OrderFinance', 'VendorRegistration', 'DriverRegistration', 'VehicleRegistration', 'SubscriptionPlanReview', 'ManualPackagePlanReview', 'ServiceLocation', 'VendorWalletSettlement');

-- AlterEnum
BEGIN;
CREATE TYPE "ConsentEntityType_new" AS ENUM ('Order', 'Vendor', 'Driver', 'Vehicle', 'Subscription', 'ManualPackage', 'ServiceLocation');
ALTER TABLE "consent_request" ALTER COLUMN "entity_type" TYPE "ConsentEntityType_new" USING ("entity_type"::text::"ConsentEntityType_new");
ALTER TYPE "ConsentEntityType" RENAME TO "ConsentEntityType_old";
ALTER TYPE "ConsentEntityType_new" RENAME TO "ConsentEntityType";
DROP TYPE "public"."ConsentEntityType_old";
COMMIT;

-- AlterTable
ALTER TABLE "consent_request" ADD COLUMN "consent_type" "ConsentType" NOT NULL;

-- CreateIndex
CREATE INDEX "consent_request_consent_type_idx" ON "consent_request"("consent_type");
