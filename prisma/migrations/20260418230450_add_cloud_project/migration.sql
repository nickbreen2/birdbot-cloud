-- CreateTable
CREATE TABLE "CloudProject" (
    "id" TEXT NOT NULL,
    "userToken" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CloudProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CloudProject_userToken_idx" ON "CloudProject"("userToken");

-- CreateIndex
CREATE UNIQUE INDEX "CloudProject_userToken_name_key" ON "CloudProject"("userToken", "name");
