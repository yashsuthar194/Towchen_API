-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('Standard', 'Lead');

-- AlterTable
ALTER TABLE "lead" ADD COLUMN     "end_location_data" JSONB,
ADD COLUMN     "start_location_data" JSONB,
ADD COLUMN     "tag_locations" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "lead_id" INTEGER,
ADD COLUMN     "type" "OrderType" NOT NULL DEFAULT 'Standard';

-- DropTable
DROP TABLE "lead_tag_location";

-- CreateIndex
CREATE UNIQUE INDEX "order_lead_id_key" ON "order"("lead_id");
