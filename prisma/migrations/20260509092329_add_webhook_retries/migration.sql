-- AlterEnum
ALTER TYPE "WebhookStatus" ADD VALUE 'pending';

-- AlterTable
ALTER TABLE "WebhookDelivery" ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;
