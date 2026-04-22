-- P1 schema corrections — fix all drift between approved sprint spec and what landed.
-- All affected tables (Entity, Mention, Goal, UserPreferences, TelegramUser) are empty.
-- No data migration required; USING casts are safe on zero rows.

-- ============================================================
-- 1. EntityType: trim 11 values → 7 sprint-doc types
--    Dropping: project, tool, event, other
-- ============================================================
CREATE TYPE "EntityType_new" AS ENUM ('file', 'concept', 'decision', 'task', 'technology', 'person', 'goal');

ALTER TABLE "Entity"
  ALTER COLUMN "type" TYPE "EntityType_new"
  USING "type"::text::"EntityType_new";

DROP TYPE "EntityType";
ALTER TYPE "EntityType_new" RENAME TO "EntityType";

-- ============================================================
-- 2. MentionSourceType: restore 3-value spec
--    Old: mcp_session, telegram_message, manual
--    New: session, decision, telegram
-- ============================================================
CREATE TYPE "MentionSourceType_new" AS ENUM ('session', 'decision', 'telegram');

ALTER TABLE "Mention"
  ALTER COLUMN "sourceType" TYPE "MentionSourceType_new"
  USING "sourceType"::text::"MentionSourceType_new";

DROP TYPE "MentionSourceType";
ALTER TYPE "MentionSourceType_new" RENAME TO "MentionSourceType";

-- ============================================================
-- 3. Goal: rename nextCheckin → lastCheckinAt, add targetDate, fix index
-- ============================================================
ALTER TABLE "Goal" RENAME COLUMN "nextCheckin" TO "lastCheckinAt";
ALTER TABLE "Goal" ADD COLUMN "targetDate" TIMESTAMP(3);

DROP INDEX "Goal_nextCheckin_idx";
CREATE INDEX "Goal_userId_lastCheckinAt_idx" ON "Goal"("userId", "lastCheckinAt");

-- ============================================================
-- 4. UserPreferences: align to spec
--    rename traits → personalitySliders
--    drop personality (old artifact)
--    add personalityPreset TEXT
--    add globalCheckinEnabled BOOLEAN
-- ============================================================
ALTER TABLE "UserPreferences" RENAME COLUMN "traits" TO "personalitySliders";
ALTER TABLE "UserPreferences" DROP COLUMN "personality";
ALTER TABLE "UserPreferences" ADD COLUMN "personalityPreset" TEXT NOT NULL DEFAULT 'assistant';
ALTER TABLE "UserPreferences" ADD COLUMN "globalCheckinEnabled" BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- 5. TelegramUser: rename telegramId → telegramChatId
-- ============================================================
DROP INDEX "TelegramUser_telegramId_key";
ALTER TABLE "TelegramUser" RENAME COLUMN "telegramId" TO "telegramChatId";
CREATE UNIQUE INDEX "TelegramUser_telegramChatId_key" ON "TelegramUser"("telegramChatId");
