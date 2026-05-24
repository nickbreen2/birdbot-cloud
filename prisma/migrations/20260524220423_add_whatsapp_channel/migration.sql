-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('telegram', 'whatsapp');

-- AlterEnum
ALTER TYPE "MentionSourceType" ADD VALUE 'whatsapp';

-- AlterTable
ALTER TABLE "TelegramUser" ADD COLUMN     "lastRedirectAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserPreferences" ADD COLUMN     "homeChannel" "ChannelType";

-- CreateTable
CREATE TABLE "WhatsAppUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "lastInboundAt" TIMESTAMP(3),
    "lastRedirectAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppPairingToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppPairingToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppUser_userId_key" ON "WhatsAppUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppUser_phoneNumber_key" ON "WhatsAppUser"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppPairingToken_token_key" ON "WhatsAppPairingToken"("token");

-- CreateIndex
CREATE INDEX "WhatsAppPairingToken_userId_idx" ON "WhatsAppPairingToken"("userId");
