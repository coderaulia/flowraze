-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "type" TEXT;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
