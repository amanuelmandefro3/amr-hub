-- AlterTable
ALTER TABLE "member" DROP CONSTRAINT "member_role_check";
ALTER TABLE "member" ADD CONSTRAINT "member_role_check" CHECK ("role" IN ('owner', 'admin', 'member', 'viewer'));
