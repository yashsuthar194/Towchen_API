-- AlterTable
ALTER TABLE "order" ADD COLUMN     "pre_booked_images" TEXT[] DEFAULT ARRAY[]::TEXT[];
