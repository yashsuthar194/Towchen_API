/*
  Warnings:

  - Added the required column `type` to the `otp` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('Number', 'Email');

-- DropIndex
DROP INDEX "otp_number_key";

-- AlterTable
ALTER TABLE "otp" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "type" "OtpType" NOT NULL,
ALTER COLUMN "number" DROP NOT NULL,
ADD CONSTRAINT "otp_pkey" PRIMARY KEY ("id");
