-- CreateTable
CREATE TABLE IF NOT EXISTS "vehicle_rc_request" (
    "id" SERIAL NOT NULL,
    "vehicle_number" VARCHAR(50) NOT NULL,
    "verification_id" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL,
    "status_code" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_rc_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vehicle_rc_request_created_at_idx" ON "vehicle_rc_request"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vehicle_rc_request_vehicle_number_idx" ON "vehicle_rc_request"("vehicle_number");

