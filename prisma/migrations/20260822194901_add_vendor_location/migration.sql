-- AlterTable
ALTER TABLE "driver" DROP COLUMN "end_location_id",
DROP COLUMN "start_location_id";

-- CreateTable
CREATE TABLE "vendor_location" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "address" TEXT,
    "street" TEXT,
    "area" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT DEFAULT 'India',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "landmark" TEXT,
    "place_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_location_vendor_id_key" ON "vendor_location"("vendor_id");

-- AddForeignKey
ALTER TABLE "vendor_location" ADD CONSTRAINT "vendor_location_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
