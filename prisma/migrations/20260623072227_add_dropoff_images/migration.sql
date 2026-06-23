-- AlterTable
ALTER TABLE "order" ADD COLUMN     "dropoff_images" TEXT[] DEFAULT ARRAY[]::TEXT[];
