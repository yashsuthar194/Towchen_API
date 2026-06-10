-- AlterTable
ALTER TABLE "order" ADD COLUMN     "is_e_job_card_for_dropoff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_e_job_card_for_pickup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "physical_dropoff_job_card_image" TEXT,
ADD COLUMN     "physical_pickup_job_card_image" TEXT;
