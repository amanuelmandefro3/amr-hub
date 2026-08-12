-- CreateTable
CREATE TABLE "loginAttempt" (
    "email" TEXT NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loginAttempt_pkey" PRIMARY KEY ("email")
);
