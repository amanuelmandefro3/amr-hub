-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invitedBy" TEXT NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitation_token_key" ON "invitation"("token");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE INDEX "invitation_token_idx" ON "invitation"("token");

-- CreateIndex
CREATE INDEX "invitation_status_idx" ON "invitation"("status");

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
