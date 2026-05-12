-- CreateEnum
CREATE TYPE "TargetScope" AS ENUM ('company', 'team', 'individual');

-- CreateEnum
CREATE TYPE "TargetPeriod" AS ENUM ('monthly', 'quarterly', 'yearly');

-- CreateTable
CREATE TABLE "SalesTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesTeamMember" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesTeamMember_pkey" PRIMARY KEY ("teamId","userId")
);

-- CreateTable
CREATE TABLE "SalesTarget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "TargetScope" NOT NULL DEFAULT 'company',
    "userId" TEXT,
    "teamId" TEXT,
    "period" "TargetPeriod" NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" INTEGER,
    "month" INTEGER,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "targetLeads" INTEGER,
    "targetDeals" INTEGER,
    "category" TEXT,
    "shareOfParent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesTarget_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SalesTeam" ADD CONSTRAINT "SalesTeam_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTeamMember" ADD CONSTRAINT "SalesTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SalesTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTeamMember" ADD CONSTRAINT "SalesTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTarget" ADD CONSTRAINT "SalesTarget_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SalesTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
