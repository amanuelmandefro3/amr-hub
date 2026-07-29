CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invitedBy" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invitation_status_check"
        CHECK ("status" IN ('PENDING', 'ACCEPTED', 'REVOKED'))
);

CREATE UNIQUE INDEX "invitation_tokenHash_key"
ON "invitation"("tokenHash");

CREATE UNIQUE INDEX "invitation_pending_email_key"
ON "invitation"(LOWER("email"))
WHERE "status" = 'PENDING';

CREATE INDEX "invitation_email_status_idx"
ON "invitation"("email", "status");

CREATE INDEX "invitation_expiresAt_idx"
ON "invitation"("expiresAt");

ALTER TABLE "invitation"
ADD CONSTRAINT "invitation_invitedBy_fkey"
FOREIGN KEY ("invitedBy") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
