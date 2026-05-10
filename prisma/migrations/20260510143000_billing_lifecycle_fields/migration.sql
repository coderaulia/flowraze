ALTER TABLE "BillingAccount"
ADD COLUMN "trialStartedAt" TIMESTAMP(3),
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "subscriptionStartedAt" TIMESTAMP(3),
ADD COLUMN "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN "canceledAt" TIMESTAMP(3);

UPDATE "BillingAccount"
SET
  "trialStartedAt" = COALESCE("trialStartedAt", "createdAt"),
  "trialEndsAt" = COALESCE("trialEndsAt", "createdAt" + INTERVAL '14 days')
WHERE "status" = 'trialing';
