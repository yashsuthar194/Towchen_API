-- AlterTable
ALTER TABLE "dealer_customer_vehicle" ALTER COLUMN "image_front" DROP NOT NULL,
ALTER COLUMN "image_rear" DROP NOT NULL,
ALTER COLUMN "image_left" DROP NOT NULL,
ALTER COLUMN "image_right" DROP NOT NULL,
ALTER COLUMN "odometer_image" DROP NOT NULL,
ADD COLUMN     "uploaded_by_dealer" BOOLEAN NOT NULL DEFAULT true;

