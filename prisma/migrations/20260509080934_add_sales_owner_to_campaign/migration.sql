-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "salesOwnerId" TEXT;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_salesOwnerId_fkey" FOREIGN KEY ("salesOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
