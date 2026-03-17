-- CreateIndex
CREATE INDEX "driver_email_is_deleted_idx" ON "driver"("email", "is_deleted");

-- CreateIndex
CREATE INDEX "driver_mobile_number_is_deleted_idx" ON "driver"("mobile_number", "is_deleted");

-- CreateIndex
CREATE INDEX "vendor_email_is_deleted_idx" ON "vendor"("email", "is_deleted");

-- CreateIndex
CREATE INDEX "vendor_mobile_number_is_deleted_idx" ON "vendor"("mobile_number", "is_deleted");
