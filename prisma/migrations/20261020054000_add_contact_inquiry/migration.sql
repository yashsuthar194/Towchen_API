-- CreateEnum
CREATE TYPE "ContactInquiryStatus" AS ENUM ('Pending', 'InProgress', 'Resolved');

-- CreateTable
CREATE TABLE "contact_inquiry" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactInquiryStatus" NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_inquiry_created_at_idx" ON "contact_inquiry"("created_at");

-- CreateIndex
CREATE INDEX "contact_inquiry_status_idx" ON "contact_inquiry"("status");

-- CreateIndex
CREATE INDEX "contact_inquiry_email_idx" ON "contact_inquiry"("email");
