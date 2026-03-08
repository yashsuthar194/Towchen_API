/*
  Warnings:

  - The values [ROS] on the enum `VendorServices` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `alternate_number` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `driver` table. All the data in the column will be lost.
  - You are about to drop the column `adhar_card_url` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `org_certificate_url` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `org_email` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `org_name` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `org_number` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_image_url` on the `vendor` table. All the data in the column will be lost.
  - You are about to drop the column `detail_url` on the `vendor_bank_detail` table. All the data in the column will be lost.
  - Added the required column `alternate_mobile_number` to the `driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driver_name` to the `driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobile_number` to the `driver` table without a default value. This is not possible if the table is not empty.
  - Added the required column `aadhar_card_url` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobile_number` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_certificate_url` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_name` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_type` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pan_number` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `representative_designation` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `representative_name` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature_type` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor_name` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor_profile_image_url` to the `vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passbook_or_cancel_check_url` to the `vendor_bank_detail` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('SoleProprietorship', 'Partnership', 'Corporation', 'LimitedLiabilityCompany', 'Cooperative');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('Upload', 'E_Sign');

-- AlterEnum
BEGIN;
CREATE TYPE "VendorServices_new" AS ENUM ('Towing', 'Technician', 'Custody', 'Hydra');
ALTER TABLE "vendor" ALTER COLUMN "services" TYPE "VendorServices_new"[] USING ("services"::text::"VendorServices_new"[]);
ALTER TYPE "VendorServices" RENAME TO "VendorServices_old";
ALTER TYPE "VendorServices_new" RENAME TO "VendorServices";
DROP TYPE "public"."VendorServices_old";
COMMIT;

-- AlterTable
ALTER TABLE "driver" DROP COLUMN "alternate_number",
DROP COLUMN "full_name",
DROP COLUMN "number",
ADD COLUMN     "alternate_mobile_number" VARCHAR(20) NOT NULL,
ADD COLUMN     "driver_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "mobile_number" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "vendor" DROP COLUMN "adhar_card_url",
DROP COLUMN "full_name",
DROP COLUMN "number",
DROP COLUMN "org_certificate_url",
DROP COLUMN "org_email",
DROP COLUMN "org_name",
DROP COLUMN "org_number",
DROP COLUMN "vendor_image_url",
ADD COLUMN     "aadhar_card_url" TEXT NOT NULL,
ADD COLUMN     "mobile_number" VARCHAR(20) NOT NULL,
ADD COLUMN     "organization_certificate_url" TEXT NOT NULL,
ADD COLUMN     "organization_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "organization_type" "OrganizationType" NOT NULL,
ADD COLUMN     "pan_number" VARCHAR(100) NOT NULL,
ADD COLUMN     "representative_designation" VARCHAR(100) NOT NULL,
ADD COLUMN     "representative_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "signature_type" "SignatureType" NOT NULL,
ADD COLUMN     "vendor_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "vendor_profile_image_url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vendor_bank_detail" DROP COLUMN "detail_url",
ADD COLUMN     "passbook_or_cancel_check_url" TEXT NOT NULL;
