CREATE TABLE "recoveryCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "recoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recoveryCode_codeHash_key"
ON "recoveryCode"("codeHash");

CREATE INDEX "recoveryCode_userId_usedAt_idx"
ON "recoveryCode"("userId", "usedAt");

CREATE INDEX "recoveryCode_expiresAt_idx"
ON "recoveryCode"("expiresAt");

ALTER TABLE "recoveryCode"
ADD CONSTRAINT "recoveryCode_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
