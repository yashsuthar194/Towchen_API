-- AlterTable
ALTER TABLE "order" ADD COLUMN     "post_pickup_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pre_pickup_images" TEXT[] DEFAULT ARRAY[]::TEXT[];
