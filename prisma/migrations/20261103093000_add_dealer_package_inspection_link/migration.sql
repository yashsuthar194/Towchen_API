-- CreateTable
CREATE TABLE IF NOT EXISTS "dealer_package_inspection_link" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "package_order_id" INTEGER NOT NULL,
    "dealer_id" INTEGER,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_submitted" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_package_inspection_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "dealer_package_inspection_link_token_key" ON "dealer_package_inspection_link"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dealer_package_inspection_link_package_order_id_idx" ON "dealer_package_inspection_link"("package_order_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "dealer_package_inspection_link_is_submitted_idx" ON "dealer_package_inspection_link"("is_submitted");

