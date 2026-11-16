-- AlterTable dealer_package_inspection_link
ALTER TABLE "dealer_package_inspection_link" ADD COLUMN IF NOT EXISTS "is_revoked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "dealer_package_inspection_link" ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMP(3);

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dealer_package_inspection_link_package_order_id_fkey'
    ) THEN
        ALTER TABLE "dealer_package_inspection_link" 
        ADD CONSTRAINT "dealer_package_inspection_link_package_order_id_fkey" 
        FOREIGN KEY ("package_order_id") REFERENCES "dealer_package_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dealer_package_inspection_link_dealer_id_fkey'
    ) THEN
        ALTER TABLE "dealer_package_inspection_link" 
        ADD CONSTRAINT "dealer_package_inspection_link_dealer_id_fkey" 
        FOREIGN KEY ("dealer_id") REFERENCES "dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
