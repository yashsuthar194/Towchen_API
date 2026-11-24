-- AlterTable
ALTER TABLE "vehicle_rc_request" ADD COLUMN IF NOT EXISTS "dealer_id" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vehicle_rc_request_dealer_id_created_at_idx" ON "vehicle_rc_request"("dealer_id", "created_at");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_rc_request_dealer_id_fkey'
    ) THEN
        ALTER TABLE "vehicle_rc_request" ADD CONSTRAINT "vehicle_rc_request_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
