-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#bcc3ff',
    "isWon" BOOLEAN NOT NULL DEFAULT false,
    "isLost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pipeline_companyId_name_key" ON "Pipeline"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_pipelineId_order_key" ON "PipelineStage"("pipelineId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_pipelineId_name_key" ON "PipelineStage"("pipelineId", "name");

-- AddForeignKey
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add nullable pipeline columns to Deal
ALTER TABLE "Deal" ADD COLUMN "pipelineId" TEXT;
ALTER TABLE "Deal" ADD COLUMN "pipelineStageId" TEXT;
ALTER TABLE "Deal" ADD COLUMN "isWon" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Deal" ADD COLUMN "isLost" BOOLEAN NOT NULL DEFAULT false;

-- Data migration: create default "Sales Pipeline" per company
INSERT INTO "Pipeline" ("id", "companyId", "name", "isDefault", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    'Sales Pipeline',
    true,
    NOW(),
    NOW()
FROM "Company";

-- Data migration: create 6 default stages per pipeline
INSERT INTO "PipelineStage" ("id", "pipelineId", "name", "order", "color", "isWon", "isLost", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    p."id",
    s.name,
    s.ord,
    s.color,
    s.is_won,
    s.is_lost,
    NOW(),
    NOW()
FROM "Pipeline" p
CROSS JOIN (VALUES
    ('New',         1, '#bcc3ff', false, false),
    ('Qualified',   2, '#4ae176', false, false),
    ('Proposal',    3, '#ffb595', false, false),
    ('Negotiation', 4, '#ff6b6b', false, false),
    ('Won',         5, '#4ae176', true,  false),
    ('Lost',        6, '#ffb4ab', false, true)
) AS s(name, ord, color, is_won, is_lost);

-- Data migration: link existing deals to their pipeline stages
UPDATE "Deal" d
SET
    "pipelineId"      = p."id",
    "pipelineStageId" = ps."id",
    "isWon"           = (d."stage" = 'won'),
    "isLost"          = (d."stage" = 'lost')
FROM "Pipeline" p
JOIN "PipelineStage" ps ON ps."pipelineId" = p."id"
WHERE p."companyId" = d."companyId"
  AND ps."name" = CASE d."stage"
    WHEN 'new'         THEN 'New'
    WHEN 'qualified'   THEN 'Qualified'
    WHEN 'proposal'    THEN 'Proposal'
    WHEN 'negotiation' THEN 'Negotiation'
    WHEN 'won'         THEN 'Won'
    WHEN 'lost'        THEN 'Lost'
    ELSE 'New'
  END;

-- Make pipelineId and pipelineStageId required
ALTER TABLE "Deal" ALTER COLUMN "pipelineId" SET NOT NULL;
ALTER TABLE "Deal" ALTER COLUMN "pipelineStageId" SET NOT NULL;

-- AddForeignKey: Deal -> Pipeline
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Deal -> PipelineStage
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_pipelineStageId_fkey" FOREIGN KEY ("pipelineStageId") REFERENCES "PipelineStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove old stage column and enum
ALTER TABLE "Deal" DROP COLUMN "stage";
DROP TYPE "DealStage";
