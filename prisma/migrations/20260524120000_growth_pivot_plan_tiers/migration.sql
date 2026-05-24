ALTER TYPE "PlanTier" RENAME TO "PlanTier_old";

CREATE TYPE "PlanTier" AS ENUM ('starter', 'growth', 'custom');

ALTER TABLE "BillingAccount"
  ALTER COLUMN "plan" DROP DEFAULT,
  ALTER COLUMN "plan" TYPE "PlanTier"
  USING (
    CASE "plan"::text
      WHEN 'free' THEN 'starter'
      WHEN 'pro' THEN 'custom'
      ELSE "plan"::text
    END
  )::"PlanTier",
  ALTER COLUMN "plan" SET DEFAULT 'growth',
  ALTER COLUMN "seats" SET DEFAULT 5;

DROP TYPE "PlanTier_old";
