-- Add new automation trigger events
ALTER TYPE "AutomationTriggerEvent" ADD VALUE IF NOT EXISTS 'lead_updated';
ALTER TYPE "AutomationTriggerEvent" ADD VALUE IF NOT EXISTS 'deal_lost';
ALTER TYPE "AutomationTriggerEvent" ADD VALUE IF NOT EXISTS 'deal_stage_changed';

-- Add new automation action types
ALTER TYPE "AutomationActionType" ADD VALUE IF NOT EXISTS 'assign_owner';
ALTER TYPE "AutomationActionType" ADD VALUE IF NOT EXISTS 'send_notification';
ALTER TYPE "AutomationActionType" ADD VALUE IF NOT EXISTS 'fire_webhook';

-- Create Notification table
CREATE TABLE "Notification" (
    "id"        TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "isRead"    BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_companyId_idx" ON "Notification"("companyId");
