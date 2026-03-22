-- CreateTable
CREATE TABLE "driver_location" (
    "id" SERIAL NOT NULL,
    "address" TEXT,
    "street" TEXT,
    "area" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "landmark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_location_pkey" PRIMARY KEY ("id")
);
