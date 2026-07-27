ALTER TABLE "user"
ADD CONSTRAINT "user_role_check"
CHECK ("role" IN ('OWNER', 'MEMBER'));

CREATE UNIQUE INDEX "user_single_owner_key"
ON "user" ("role")
WHERE "role" = 'OWNER';
