ALTER TYPE "WebhookEvent" ADD VALUE IF NOT EXISTS 'lead_updated';
ALTER TYPE "WebhookEvent" ADD VALUE IF NOT EXISTS 'lead_deleted';
ALTER TYPE "WebhookEvent" ADD VALUE IF NOT EXISTS 'deal_updated';
ALTER TYPE "WebhookEvent" ADD VALUE IF NOT EXISTS 'deal_stage_changed';
ALTER TYPE "WebhookEvent" ADD VALUE IF NOT EXISTS 'deal_lost';
ALTER TYPE "WebhookEvent" ADD VALUE IF NOT EXISTS 'deal_deleted';
ALTER TYPE "WebhookEvent" ADD VALUE IF NOT EXISTS 'activity_updated';
ALTER TYPE "WebhookEvent" ADD VALUE IF NOT EXISTS 'activity_deleted';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "consentVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "consentedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Activity_companyId_createdBy_idx" ON "Activity"("companyId", "createdBy");
CREATE INDEX IF NOT EXISTS "Activity_companyId_createdAt_idx" ON "Activity"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "AutomationRule_companyId_triggerEvent_isActive_idx" ON "AutomationRule"("companyId", "triggerEvent", "isActive");
CREATE INDEX IF NOT EXISTS "AutomationRun_status_nextRetryAt_idx" ON "AutomationRun"("status", "nextRetryAt");
CREATE INDEX IF NOT EXISTS "AutomationRun_companyId_ruleId_idx" ON "AutomationRun"("companyId", "ruleId");
CREATE INDEX IF NOT EXISTS "BillingAccount_status_subscriptionEndsAt_idx" ON "BillingAccount"("status", "subscriptionEndsAt");
CREATE INDEX IF NOT EXISTS "BillingPayment_billingAccountId_status_idx" ON "BillingPayment"("billingAccountId", "status");
CREATE INDEX IF NOT EXISTS "BillingPayment_companyId_createdAt_idx" ON "BillingPayment"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "Campaign_companyId_createdAt_idx" ON "Campaign"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "Deal_companyId_ownerId_idx" ON "Deal"("companyId", "ownerId");
CREATE INDEX IF NOT EXISTS "Deal_companyId_isWon_closedAt_idx" ON "Deal"("companyId", "isWon", "closedAt");
CREATE INDEX IF NOT EXISTS "Deal_companyId_pipelineStageId_idx" ON "Deal"("companyId", "pipelineStageId");
CREATE INDEX IF NOT EXISTS "Deal_companyId_createdAt_idx" ON "Deal"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "Lead_companyId_ownerId_idx" ON "Lead"("companyId", "ownerId");
CREATE INDEX IF NOT EXISTS "Lead_companyId_status_idx" ON "Lead"("companyId", "status");
CREATE INDEX IF NOT EXISTS "Lead_companyId_createdAt_idx" ON "Lead"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "SalesTarget_companyId_scope_year_idx" ON "SalesTarget"("companyId", "scope", "year");
CREATE INDEX IF NOT EXISTS "SalesTarget_companyId_userId_idx" ON "SalesTarget"("companyId", "userId");
CREATE INDEX IF NOT EXISTS "SalesTarget_companyId_teamId_idx" ON "SalesTarget"("companyId", "teamId");
CREATE INDEX IF NOT EXISTS "User_companyId_role_isActive_idx" ON "User"("companyId", "role", "isActive");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_status_nextRetryAt_idx" ON "WebhookDelivery"("status", "nextRetryAt");
CREATE INDEX IF NOT EXISTS "WebhookDelivery_endpointId_createdAt_idx" ON "WebhookDelivery"("endpointId", "createdAt");
CREATE INDEX IF NOT EXISTS "WebhookEndpoint_companyId_event_isActive_idx" ON "WebhookEndpoint"("companyId", "event", "isActive");
