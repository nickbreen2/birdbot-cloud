-- CreateTable
CREATE TABLE "CloudSession" (
    "id" TEXT NOT NULL,
    "userToken" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudDecision" (
    "id" TEXT NOT NULL,
    "userToken" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "sessionId" TEXT,
    "decision" TEXT NOT NULL,
    "reasoning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CloudSession_sessionId_key" ON "CloudSession"("sessionId");

-- CreateIndex
CREATE INDEX "CloudSession_userToken_project_idx" ON "CloudSession"("userToken", "project");

-- CreateIndex
CREATE INDEX "CloudDecision_userToken_project_idx" ON "CloudDecision"("userToken", "project");

-- CreateIndex
CREATE INDEX "CloudDecision_sessionId_idx" ON "CloudDecision"("sessionId");
