/*
  Warnings:

  - You are about to drop the column `conditions` on the `sub_service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sub_service" DROP COLUMN "conditions";

-- CreateTable
CREATE TABLE "sub_service_condtion" (
    "id" SERIAL NOT NULL,
    "sub_service_id" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_service_condtion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sub_service_condtion_sub_service_id_idx" ON "sub_service_condtion"("sub_service_id");
