/*
  Warnings:

  - Made the column `companyId` on table `Activity` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `ApiKey` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `BillingAccount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Campaign` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Deal` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Lead` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `SalesTarget` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `SalesTeam` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `WebhookEndpoint` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ApiKey" DROP CONSTRAINT "ApiKey_companyId_fkey";

-- DropForeignKey
ALTER TABLE "BillingAccount" DROP CONSTRAINT "BillingAccount_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Deal" DROP CONSTRAINT "Deal_companyId_fkey";

-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_companyId_fkey";

-- DropForeignKey
ALTER TABLE "SalesTarget" DROP CONSTRAINT "SalesTarget_companyId_fkey";

-- DropForeignKey
ALTER TABLE "SalesTeam" DROP CONSTRAINT "SalesTeam_companyId_fkey";

-- DropForeignKey
ALTER TABLE "WebhookEndpoint" DROP CONSTRAINT "WebhookEndpoint_companyId_fkey";

-- AlterTable
ALTER TABLE "Activity" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ApiKey" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "BillingAccount" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Campaign" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Deal" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SalesTarget" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SalesTeam" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'employee';

-- AlterTable
ALTER TABLE "WebhookEndpoint" ALTER COLUMN "companyId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingAccount" ADD CONSTRAINT "BillingAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTeam" ADD CONSTRAINT "SalesTeam_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old unique constraints
DROP INDEX "Lead_ownerId_email_key";
DROP INDEX "Campaign_name_channel_startDate_key";

-- Add new unique constraints
CREATE UNIQUE INDEX "BillingAccount_companyId_key" ON "BillingAccount"("companyId");
CREATE UNIQUE INDEX "Campaign_companyId_name_channel_startDate_key" ON "Campaign"("companyId", "name", "channel", "startDate");
CREATE UNIQUE INDEX "Lead_companyId_email_key" ON "Lead"("companyId", "email");
CREATE UNIQUE INDEX "SalesTeam_companyId_name_key" ON "SalesTeam"("companyId", "name");

-- Update Enum Type Role
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('superadmin', 'admin', 'manager', 'employee');
ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN role TYPE "Role" USING role::text::"Role";
ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'employee';
DROP TYPE "Role_old";
