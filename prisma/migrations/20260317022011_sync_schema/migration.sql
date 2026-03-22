/*
  Warnings:

  - You are about to drop the column `adhar_card_url` on the `driver` table. All the data in the column will be lost.
  - Added the required column `aadhar_card_url` to the `driver` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "driver" DROP COLUMN "adhar_card_url",
ADD COLUMN     "aadhar_card_url" TEXT NOT NULL,
ADD COLUMN     "end_location" INTEGER,
ADD COLUMN     "start_location" INTEGER;
