/*
  Warnings:

  - You are about to drop the column `org_alternate_number` on the `vendor` table. All the data in the column will be lost.
  - Added the required column `alternate_number` to the `vendor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vendor" DROP COLUMN "org_alternate_number",
ADD COLUMN     "alternate_number" VARCHAR(20) NOT NULL,
ALTER COLUMN "signature_url" DROP NOT NULL;

