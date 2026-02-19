-- CreateIndex
CREATE INDEX "vendor_id_formated_id_idx" ON "vendor"("id", "formated_id");

-- CreateIndex
CREATE INDEX "vendor_bank_detail_vendor_id_idx" ON "vendor_bank_detail"("vendor_id");
