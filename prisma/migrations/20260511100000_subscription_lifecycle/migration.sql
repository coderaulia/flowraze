-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'annual');

-- AlterTable
ALTER TABLE "BillingAccount"
ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'monthly',
ADD COLUMN "cancelReason" TEXT;
