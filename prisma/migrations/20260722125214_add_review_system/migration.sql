-- CreateEnum
CREATE TYPE "ReviewUserType" AS ENUM ('Customer', 'Driver');

-- AlterTable: driver
ALTER TABLE "driver" ADD COLUMN "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "total_reviews" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: customer
ALTER TABLE "customer" ADD COLUMN "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "total_reviews" INTEGER NOT NULL DEFAULT 0;

-- AlterEnum: OrderOtpType (add BREAKDOWN, DROP if not present)
ALTER TYPE "OrderOtpType" ADD VALUE IF NOT EXISTS 'BREAKDOWN';
ALTER TYPE "OrderOtpType" ADD VALUE IF NOT EXISTS 'DROP';

-- CreateTable: review
CREATE TABLE "review" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "reviewer_type" "ReviewUserType" NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "reviewee_type" "ReviewUserType" NOT NULL,
    "reviewee_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(150),
    "comment" TEXT,
    "tags" JSONB,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_order_id_idx" ON "review"("order_id");

-- CreateIndex
CREATE INDEX "review_reviewee_type_reviewee_id_idx" ON "review"("reviewee_type", "reviewee_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_order_id_reviewer_type_reviewer_id_key" ON "review"("order_id", "reviewer_type", "reviewer_id");
