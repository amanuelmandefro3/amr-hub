-- CreateTable
CREATE TABLE "securityEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "organizationId" TEXT,

    CONSTRAINT "securityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "securityEvent_userId_createdAt_idx" ON "securityEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "securityEvent_organizationId_createdAt_idx" ON "securityEvent"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "securityEvent" ADD CONSTRAINT "securityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "securityEvent" ADD CONSTRAINT "securityEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
