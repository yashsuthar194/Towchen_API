-- CreateTable
CREATE TABLE "customer_address" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
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
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_address_customer_id_idx" ON "customer_address"("customer_id");
