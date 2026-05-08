-- P1: Knowledge graph schema
CREATE EXTENSION IF NOT EXISTS vector;

-- Enums
CREATE TYPE "EntityType" AS ENUM ('person', 'project', 'tool', 'concept', 'decision', 'event', 'other');
CREATE TYPE "MentionSourceType" AS ENUM ('mcp_session', 'telegram_message', 'manual');
CREATE TYPE "GoalStatus" AS ENUM ('active', 'completed', 'paused', 'abandoned', 'pending_confirmation');
CREATE TYPE "CheckinCadence" AS ENUM ('daily', 'weekly', 'biweekly', 'monthly');

-- Entity
CREATE TABLE "Entity" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "userToken"   TEXT,
    "project"     TEXT,
    "name"        TEXT NOT NULL,
    "type"        "EntityType" NOT NULL,
    "description" TEXT,
    "embedding"   vector(1536),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Entity_userId_project_name_type_key" ON "Entity"("userId", "project", "name", "type");
CREATE INDEX "Entity_userId_idx" ON "Entity"("userId");
CREATE INDEX "Entity_userToken_idx" ON "Entity"("userToken");

-- Relationship
CREATE TABLE "Relationship" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "fromId"    TEXT NOT NULL,
    "toId"      TEXT NOT NULL,
    "label"     TEXT NOT NULL,
    "weight"    DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Relationship_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Relationship_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Relationship_userId_fromId_toId_label_key" ON "Relationship"("userId", "fromId", "toId", "label");
CREATE INDEX "Relationship_userId_idx" ON "Relationship"("userId");
CREATE INDEX "Relationship_fromId_idx" ON "Relationship"("fromId");
CREATE INDEX "Relationship_toId_idx" ON "Relationship"("toId");

-- Mention
CREATE TABLE "Mention" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "entityId"   TEXT NOT NULL,
    "sourceType" "MentionSourceType" NOT NULL,
    "sourceId"   TEXT NOT NULL,
    "snippet"    TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Mention_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Mention_userId_idx" ON "Mention"("userId");
CREATE INDEX "Mention_entityId_idx" ON "Mention"("entityId");
CREATE INDEX "Mention_sourceId_idx" ON "Mention"("sourceId");

-- Goal
CREATE TABLE "Goal" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "entityId"    TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "status"      "GoalStatus" NOT NULL DEFAULT 'active',
    "cadence"     "CheckinCadence" NOT NULL DEFAULT 'weekly',
    "nextCheckin" TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Goal_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Goal_entityId_key" ON "Goal"("entityId");
CREATE INDEX "Goal_userId_status_idx" ON "Goal"("userId", "status");
CREATE INDEX "Goal_nextCheckin_idx" ON "Goal"("nextCheckin");

-- UserPreferences
CREATE TABLE "UserPreferences" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "userToken"   TEXT,
    "traits"      JSONB,
    "personality" JSONB,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");
CREATE UNIQUE INDEX "UserPreferences_userToken_key" ON "UserPreferences"("userToken");

-- TelegramUser
CREATE TABLE "TelegramUser" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username"   TEXT,
    "firstName"  TEXT,
    "lastName"   TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TelegramUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TelegramUser_userId_key" ON "TelegramUser"("userId");
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");

-- TelegramPairingToken
CREATE TABLE "TelegramPairingToken" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "token"     TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt"    TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramPairingToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TelegramPairingToken_token_key" ON "TelegramPairingToken"("token");
CREATE INDEX "TelegramPairingToken_userId_idx" ON "TelegramPairingToken"("userId");
