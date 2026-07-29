-- Preserve the existing custom invitation flow under a distinct table name.
ALTER TABLE "invitation" RENAME TO "workspaceInvitation";

DROP INDEX IF EXISTS "user_single_owner_key";

CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "member_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "member_role_check" CHECK ("role" IN ('owner', 'admin', 'member'))
);

CREATE TABLE "organizationInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,
    CONSTRAINT "organizationInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organization_key_key" ON "organization"("key");
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");
CREATE INDEX "member_userId_idx" ON "member"("userId");
CREATE INDEX "organizationInvitation_organizationId_idx" ON "organizationInvitation"("organizationId");
CREATE INDEX "organizationInvitation_email_idx" ON "organizationInvitation"("email");
CREATE INDEX "organizationInvitation_inviterId_idx" ON "organizationInvitation"("inviterId");

INSERT INTO "organization" ("id", "name", "key", "slug", "createdAt", "updatedAt")
VALUES (
    'amr-hub-legacy-organization',
    'AMR Hub',
    'AMR',
    'amr-hub',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "member" ("id", "organizationId", "userId", "role", "createdAt")
SELECT
    'legacy-member-' || "id",
    'amr-hub-legacy-organization',
    "id",
    CASE WHEN "role" = 'OWNER' THEN 'owner' ELSE 'member' END,
    "createdAt"
FROM "user";

ALTER TABLE "session" ADD COLUMN "activeOrganizationId" TEXT;
UPDATE "session"
SET "activeOrganizationId" = 'amr-hub-legacy-organization';

ALTER TABLE "Issue" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Label" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "SavedView" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Cycle" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "workspaceInvitation" ADD COLUMN "organizationId" TEXT;

UPDATE "Issue" SET "organizationId" = 'amr-hub-legacy-organization';
UPDATE "Label" SET "organizationId" = 'amr-hub-legacy-organization';
UPDATE "SavedView" SET "organizationId" = 'amr-hub-legacy-organization';
UPDATE "Cycle" SET "organizationId" = 'amr-hub-legacy-organization';
UPDATE "workspaceInvitation" SET "organizationId" = 'amr-hub-legacy-organization';

ALTER TABLE "Issue" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Label" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "SavedView" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Cycle" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "workspaceInvitation" ALTER COLUMN "organizationId" SET NOT NULL;

DROP INDEX IF EXISTS "Issue_sequence_key";
DROP INDEX IF EXISTS "Label_name_key";
DROP INDEX IF EXISTS "Cycle_name_key";
DROP INDEX IF EXISTS "SavedView_userId_name_key";
DROP INDEX IF EXISTS "invitation_pending_email_key";

CREATE UNIQUE INDEX "Issue_organizationId_sequence_key" ON "Issue"("organizationId", "sequence");
CREATE INDEX "Issue_organizationId_status_idx" ON "Issue"("organizationId", "status");
CREATE UNIQUE INDEX "Label_organizationId_name_key" ON "Label"("organizationId", "name");
CREATE INDEX "Label_organizationId_idx" ON "Label"("organizationId");
CREATE UNIQUE INDEX "SavedView_organizationId_userId_name_key" ON "SavedView"("organizationId", "userId", "name");
CREATE INDEX "SavedView_organizationId_idx" ON "SavedView"("organizationId");
CREATE UNIQUE INDEX "Cycle_organizationId_name_key" ON "Cycle"("organizationId", "name");
CREATE INDEX "Cycle_organizationId_idx" ON "Cycle"("organizationId");
CREATE INDEX "workspaceInvitation_organizationId_idx" ON "workspaceInvitation"("organizationId");
CREATE UNIQUE INDEX "workspaceInvitation_pending_email_key"
ON "workspaceInvitation"("organizationId", LOWER("email"))
WHERE "status" = 'PENDING';

ALTER TABLE "member"
ADD CONSTRAINT "member_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member"
ADD CONSTRAINT "member_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organizationInvitation"
ADD CONSTRAINT "organizationInvitation_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "organizationInvitation"
ADD CONSTRAINT "organizationInvitation_inviterId_fkey"
FOREIGN KEY ("inviterId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Issue"
ADD CONSTRAINT "Issue_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Label"
ADD CONSTRAINT "Label_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavedView"
ADD CONSTRAINT "SavedView_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Cycle"
ADD CONSTRAINT "Cycle_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspaceInvitation"
ADD CONSTRAINT "workspaceInvitation_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
