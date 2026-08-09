/*
  Warnings:

  - You are about to drop the column `assignee` on the `Issue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "assignee",
ADD COLUMN     "assigneeId" TEXT;

-- AlterTable
ALTER TABLE "member" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "organization" ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workspaceInvitation" RENAME CONSTRAINT "invitation_pkey" TO "workspaceInvitation_pkey";

-- CreateIndex
CREATE INDEX "Issue_assigneeId_idx" ON "Issue"("assigneeId");

-- RenameForeignKey
ALTER TABLE "workspaceInvitation" RENAME CONSTRAINT "invitation_invitedBy_fkey" TO "workspaceInvitation_invitedBy_fkey";

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "invitation_email_status_idx" RENAME TO "workspaceInvitation_email_status_idx";

-- RenameIndex
ALTER INDEX "invitation_expiresAt_idx" RENAME TO "workspaceInvitation_expiresAt_idx";

-- RenameIndex
ALTER INDEX "invitation_tokenHash_key" RENAME TO "workspaceInvitation_tokenHash_key";
