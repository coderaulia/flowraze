-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'manager';
ALTER TYPE "Role" ADD VALUE 'employee';

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "BillingAccount" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "SalesTarget" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "SalesTeam" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "WebhookEndpoint" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingAccount" ADD CONSTRAINT "BillingAccount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTeam" ADD CONSTRAINT "SalesTeam_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create default company
INSERT INTO "Company" (id, name, slug, "isActive", "createdAt", "updatedAt")
VALUES ('default-company-id', 'Default Company', 'default', true, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Assign all non-superadmin users to default company
UPDATE "User" SET "companyId" = 'default-company-id' WHERE role != 'superadmin';

-- Assign all other entities to default company
UPDATE "Activity" SET "companyId" = 'default-company-id';
UPDATE "ApiKey" SET "companyId" = 'default-company-id';
UPDATE "BillingAccount" SET "companyId" = 'default-company-id';
UPDATE "Campaign" SET "companyId" = 'default-company-id';
UPDATE "Deal" SET "companyId" = 'default-company-id';
UPDATE "Lead" SET "companyId" = 'default-company-id';
UPDATE "SalesTarget" SET "companyId" = 'default-company-id';
UPDATE "SalesTeam" SET "companyId" = 'default-company-id';
UPDATE "WebhookEndpoint" SET "companyId" = 'default-company-id';


