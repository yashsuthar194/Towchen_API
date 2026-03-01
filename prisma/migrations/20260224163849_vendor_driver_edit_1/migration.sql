-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('Available', 'Busy', 'UnderApproval', 'Banned');

-- AlterTable
ALTER TABLE "driver" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_deleted_by" INTEGER,
ADD COLUMN     "status" "DriverStatus" NOT NULL DEFAULT 'Busy',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "vendor" ADD COLUMN     "is_deleted_by" INTEGER,
ADD COLUMN     "is_gst_vendor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_number_verified" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "is_email_verified" SET DEFAULT true;
