/*
  Warnings:

  - The values [UnAvailable] on the enum `AvailabilityStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AvailabilityStatus_new" AS ENUM ('Available', 'Unavailable', 'Onboard Pending');
ALTER TABLE "public"."driver" ALTER COLUMN "availability_status" DROP DEFAULT;
ALTER TABLE "driver" ALTER COLUMN "availability_status" TYPE "AvailabilityStatus_new" USING ("availability_status"::text::"AvailabilityStatus_new");
ALTER TYPE "AvailabilityStatus" RENAME TO "AvailabilityStatus_old";
ALTER TYPE "AvailabilityStatus_new" RENAME TO "AvailabilityStatus";
DROP TYPE "public"."AvailabilityStatus_old";
ALTER TABLE "driver" ALTER COLUMN "availability_status" SET DEFAULT 'Onboard Pending';
COMMIT;
