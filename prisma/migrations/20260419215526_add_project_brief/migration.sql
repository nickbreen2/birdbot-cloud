-- CreateTable
CREATE TABLE "ProjectBrief" (
    "id" TEXT NOT NULL,
    "userToken" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectBrief_userToken_idx" ON "ProjectBrief"("userToken");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectBrief_userToken_project_key" ON "ProjectBrief"("userToken", "project");
