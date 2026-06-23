-- AlterEnum
ALTER TYPE "OrderOtpType" RENAME VALUE 'START' TO 'BREAKDOWN';
ALTER TYPE "OrderOtpType" RENAME VALUE 'COMPLETE' TO 'DROP';

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "dropoff_images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable (update default)
ALTER TABLE "order_otp" ALTER COLUMN "type" SET DEFAULT 'BREAKDOWN';
