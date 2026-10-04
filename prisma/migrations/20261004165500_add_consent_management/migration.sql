-- CreateEnum
CREATE TYPE "ConsentRole" AS ENUM ('Approver', 'Verifier', 'Finalizer');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PendingApproval', 'PendingVerification', 'PendingFinalization', 'PermissionGranted', 'Terminated');

-- CreateEnum
CREATE TYPE "ConsentStep" AS ENUM ('Approval', 'Verification', 'Finalization');

-- CreateEnum
CREATE TYPE "ConsentAction" AS ENUM ('Submit', 'Approve', 'Verify', 'Finalize', 'Reject');

-- CreateEnum
CREATE TYPE "ConsentEntityType" AS ENUM ('OrderEdit', 'VendorOnboarding');

-- AlterTable
ALTER TABLE "admin" ADD COLUMN     "consent_roles" "ConsentRole"[] DEFAULT ARRAY[]::"ConsentRole"[];

-- CreateTable
CREATE TABLE "consent_request" (
    "id" SERIAL NOT NULL,
    "entity_type" "ConsentEntityType" NOT NULL,
    "entity_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "proposed_payload" JSONB NOT NULL,
    "original_payload" JSONB,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PendingApproval',
    "current_step" "ConsentStep" NOT NULL DEFAULT 'Approval',
    "created_by_id" INTEGER NOT NULL,
    "created_by_role" "Role" NOT NULL,
    "finalized_at" TIMESTAMP(3),
    "terminated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_audit_log" (
    "id" SERIAL NOT NULL,
    "consent_request_id" INTEGER NOT NULL,
    "step" "ConsentStep" NOT NULL,
    "action" "ConsentAction" NOT NULL,
    "previous_status" "ConsentStatus" NOT NULL,
    "new_status" "ConsentStatus" NOT NULL,
    "performed_by_id" INTEGER NOT NULL,
    "performed_by_role" VARCHAR(50) NOT NULL,
    "actor_consent_role" "ConsentRole" NOT NULL,
    "remarks" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consent_request_entity_type_entity_id_idx" ON "consent_request"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "consent_request_status_idx" ON "consent_request"("status");

-- CreateIndex
CREATE INDEX "consent_request_current_step_idx" ON "consent_request"("current_step");

-- CreateIndex
CREATE INDEX "consent_request_created_by_id_created_by_role_idx" ON "consent_request"("created_by_id", "created_by_role");

-- CreateIndex
CREATE INDEX "consent_audit_log_consent_request_id_idx" ON "consent_audit_log"("consent_request_id");

-- CreateIndex
CREATE INDEX "consent_audit_log_performed_by_id_idx" ON "consent_audit_log"("performed_by_id");
