-- Collapse duplicated demo/user records before adding natural duplicate guards.
WITH ranked_campaigns AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (
            PARTITION BY name, channel, "startDate"
            ORDER BY "createdAt" ASC, id ASC
        ) AS keep_id,
        ROW_NUMBER() OVER (
            PARTITION BY name, channel, "startDate"
            ORDER BY "createdAt" ASC, id ASC
        ) AS row_number
    FROM "Campaign"
)
UPDATE "Lead" AS lead
SET "campaignId" = ranked_campaigns.keep_id
FROM ranked_campaigns
WHERE ranked_campaigns.row_number > 1
  AND lead."campaignId" = ranked_campaigns.id;

WITH ranked_campaigns AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY name, channel, "startDate"
            ORDER BY "createdAt" ASC, id ASC
        ) AS row_number
    FROM "Campaign"
)
DELETE FROM "Campaign" AS campaign
USING ranked_campaigns
WHERE ranked_campaigns.row_number > 1
  AND campaign.id = ranked_campaigns.id;

WITH ranked_leads AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (
            PARTITION BY "ownerId", email
            ORDER BY "createdAt" ASC, id ASC
        ) AS keep_id,
        ROW_NUMBER() OVER (
            PARTITION BY "ownerId", email
            ORDER BY "createdAt" ASC, id ASC
        ) AS row_number
    FROM "Lead"
)
UPDATE "Deal" AS deal
SET "leadId" = ranked_leads.keep_id
FROM ranked_leads
WHERE ranked_leads.row_number > 1
  AND deal."leadId" = ranked_leads.id;

WITH ranked_leads AS (
    SELECT
        id,
        FIRST_VALUE(id) OVER (
            PARTITION BY "ownerId", email
            ORDER BY "createdAt" ASC, id ASC
        ) AS keep_id,
        ROW_NUMBER() OVER (
            PARTITION BY "ownerId", email
            ORDER BY "createdAt" ASC, id ASC
        ) AS row_number
    FROM "Lead"
)
UPDATE "Activity" AS activity
SET "leadId" = ranked_leads.keep_id
FROM ranked_leads
WHERE ranked_leads.row_number > 1
  AND activity."leadId" = ranked_leads.id;

WITH ranked_deals AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "leadId", title, "ownerId"
            ORDER BY "createdAt" ASC, id ASC
        ) AS row_number
    FROM "Deal"
)
DELETE FROM "Deal" AS deal
USING ranked_deals
WHERE ranked_deals.row_number > 1
  AND deal.id = ranked_deals.id;

WITH ranked_activities AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "leadId", type, content, "createdBy"
            ORDER BY "createdAt" ASC, id ASC
        ) AS row_number
    FROM "Activity"
)
DELETE FROM "Activity" AS activity
USING ranked_activities
WHERE ranked_activities.row_number > 1
  AND activity.id = ranked_activities.id;

WITH ranked_leads AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "ownerId", email
            ORDER BY "createdAt" ASC, id ASC
        ) AS row_number
    FROM "Lead"
)
DELETE FROM "Lead" AS lead
USING ranked_leads
WHERE ranked_leads.row_number > 1
  AND lead.id = ranked_leads.id;

CREATE UNIQUE INDEX "Lead_ownerId_email_key" ON "Lead"("ownerId", "email");
CREATE UNIQUE INDEX "Deal_leadId_title_ownerId_key" ON "Deal"("leadId", "title", "ownerId");
CREATE UNIQUE INDEX "Campaign_name_channel_startDate_key" ON "Campaign"("name", "channel", "startDate");
CREATE UNIQUE INDEX "Activity_leadId_type_content_createdBy_key" ON "Activity"("leadId", "type", "content", "createdBy");
