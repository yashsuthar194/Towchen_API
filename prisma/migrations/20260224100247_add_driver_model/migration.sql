-- CreateTable
CREATE TABLE "driver" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "alternate_number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_number_verified" BOOLEAN NOT NULL DEFAULT false,
    "adhar_card_url" TEXT NOT NULL,
    "pan_card_url" TEXT NOT NULL,
    "driver_license_url" TEXT NOT NULL,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_email_key" ON "driver"("email");
