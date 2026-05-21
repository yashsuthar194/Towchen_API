-- CreateEnum
CREATE TYPE "JourneyType" AS ENUM ('FourWay', 'ThreeWay');

-- AlterTable
ALTER TABLE "sub_service" ADD COLUMN     "conditions" TEXT[],
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "journey_type" "JourneyType" NOT NULL DEFAULT 'FourWay';
