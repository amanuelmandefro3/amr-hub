-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "targetDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "issueId" TEXT,
    "projectId" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Backfill: one default "General" project per existing organization, reusing the
-- organization's own key so existing issue ids (e.g. "AMR-12") stay valid.
INSERT INTO "Project" ("id", "key", "name", "status", "organizationId", "createdAt", "updatedAt")
SELECT "id" || '-general', "key", 'General', 'ACTIVE', "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "organization";

-- AlterTable (nullable first so the backfill below can populate existing rows)
ALTER TABLE "Cycle" ADD COLUMN "projectId" TEXT;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "creatorId" TEXT,
ADD COLUMN     "projectId" TEXT;

-- Backfill existing cycles/issues onto their organization's default project.
UPDATE "Cycle" c
SET "projectId" = p."id"
FROM "Project" p
WHERE p."organizationId" = c."organizationId";

UPDATE "Issue" i
SET "projectId" = p."id"
FROM "Project" p
WHERE p."organizationId" = i."organizationId";

-- Backfill Issue.creatorId from each issue's earliest "CREATED" activity row.
UPDATE "Issue" i
SET "creatorId" = a."actorId"
FROM "Activity" a
WHERE a."id" = (
  SELECT "id" FROM "Activity"
  WHERE "Activity"."issueId" = i."id" AND "Activity"."type" = 'CREATED'
  ORDER BY "createdAt" ASC
  LIMIT 1
);

-- Now that every row has a project, enforce NOT NULL.
ALTER TABLE "Cycle" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "Issue" ALTER COLUMN "projectId" SET NOT NULL;

-- DropIndex (superseded by project-scoped uniqueness below)
DROP INDEX "Cycle_organizationId_name_key";
DROP INDEX "Issue_organizationId_sequence_key";

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_key_key" ON "Project"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_name_key" ON "Project"("organizationId", "name");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE INDEX "Cycle_projectId_idx" ON "Cycle"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Cycle_projectId_name_key" ON "Cycle"("projectId", "name");

-- CreateIndex
CREATE INDEX "Issue_projectId_status_idx" ON "Issue"("projectId", "status");

-- CreateIndex
CREATE INDEX "Issue_creatorId_idx" ON "Issue"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_projectId_sequence_key" ON "Issue"("projectId", "sequence");

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cycle" ADD CONSTRAINT "Cycle_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
