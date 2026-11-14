-- CreateEnum DisputeType
DO $$ BEGIN
    CREATE TYPE "DisputeType" AS ENUM (
        'TollDispute',
        'KmDispute',
        'HydraDispute',
        'BorderDispute',
        'ExtraChargeDispute',
        'WaitingDispute',
        'FuelChargeDispute'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum DisputeRole
DO $$ BEGIN
    CREATE TYPE "DisputeRole" AS ENUM (
        'Resolver',
        'Verifier',
        'Finalizer'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum DisputeStatus
DO $$ BEGIN
    CREATE TYPE "DisputeStatus" AS ENUM (
        'PendingResolution',
        'PendingVerification',
        'PendingFinalization',
        'PermissionGranted',
        'Terminated'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum DisputeStep
DO $$ BEGIN
    CREATE TYPE "DisputeStep" AS ENUM (
        'Resolution',
        'Verification',
        'Finalization'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum DisputeAction
DO $$ BEGIN
    CREATE TYPE "DisputeAction" AS ENUM (
        'Submit',
        'Resolve',
        'Verify',
        'Finalize',
        'Reject'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable admin: add dispute_roles column
ALTER TABLE "admin" ADD COLUMN IF NOT EXISTS "dispute_roles" "DisputeRole"[] DEFAULT ARRAY[]::"DisputeRole"[];

-- CreateTable dispute_request
CREATE TABLE IF NOT EXISTS "dispute_request" (
    "id" SERIAL NOT NULL,
    "formated_id" VARCHAR(255) NOT NULL DEFAULT '',
    "order_id" INTEGER NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "dispute_type" "DisputeType" NOT NULL,
    "demanded_amount" DOUBLE PRECISION NOT NULL,
    "approved_amount" DOUBLE PRECISION,
    "description" TEXT,
    "proof_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "DisputeStatus" NOT NULL DEFAULT 'PendingResolution',
    "current_step" "DisputeStep" NOT NULL DEFAULT 'Resolution',
    "created_by_id" INTEGER NOT NULL,
    "finalized_at" TIMESTAMP(3),
    "terminated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable dispute_audit_log
CREATE TABLE IF NOT EXISTS "dispute_audit_log" (
    "id" SERIAL NOT NULL,
    "dispute_request_id" INTEGER NOT NULL,
    "step" "DisputeStep" NOT NULL,
    "action" "DisputeAction" NOT NULL,
    "previous_status" "DisputeStatus" NOT NULL,
    "new_status" "DisputeStatus" NOT NULL,
    "performed_by_id" INTEGER NOT NULL,
    "performed_by_role" VARCHAR(50) NOT NULL,
    "actor_dispute_role" "DisputeRole",
    "demanded_amount" DOUBLE PRECISION,
    "approved_amount" DOUBLE PRECISION,
    "remarks" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex dispute_request indexes
CREATE UNIQUE INDEX IF NOT EXISTS "dispute_request_formated_id_key" ON "dispute_request"("formated_id");
CREATE INDEX IF NOT EXISTS "dispute_request_order_id_idx" ON "dispute_request"("order_id");
CREATE INDEX IF NOT EXISTS "dispute_request_vendor_id_idx" ON "dispute_request"("vendor_id");
CREATE INDEX IF NOT EXISTS "dispute_request_status_idx" ON "dispute_request"("status");
CREATE INDEX IF NOT EXISTS "dispute_request_current_step_idx" ON "dispute_request"("current_step");
CREATE INDEX IF NOT EXISTS "dispute_request_dispute_type_idx" ON "dispute_request"("dispute_type");

-- CreateIndex dispute_audit_log indexes
CREATE INDEX IF NOT EXISTS "dispute_audit_log_dispute_request_id_idx" ON "dispute_audit_log"("dispute_request_id");
CREATE INDEX IF NOT EXISTS "dispute_audit_log_performed_by_id_idx" ON "dispute_audit_log"("performed_by_id");

-- Trigger to generate formatted ID for dispute_request (DSP0000001)
CREATE OR REPLACE FUNCTION generate_dispute_formatted_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := nextval(pg_get_serial_sequence('dispute_request', 'id'));
    END IF;

    NEW.formated_id := 'DSP' || LPAD(NEW.id::text, 7, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger for dispute_request
DROP TRIGGER IF EXISTS trg_dispute_request_formatted_id ON "dispute_request";
CREATE TRIGGER trg_dispute_request_formatted_id
BEFORE INSERT ON "dispute_request"
FOR EACH ROW
EXECUTE FUNCTION generate_dispute_formatted_id();

