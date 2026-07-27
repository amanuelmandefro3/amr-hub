-- CreateTable
CREATE TABLE "Cycle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cycle_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "estimate" INTEGER;
ALTER TABLE "Issue" ADD COLUMN "cycleId" TEXT;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "Cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Cycle_name_key" ON "Cycle"("name");
CREATE INDEX "Cycle_startDate_endDate_idx" ON "Cycle"("startDate", "endDate");
CREATE INDEX "Issue_cycleId_idx" ON "Issue"("cycleId");

-- Seed a realistic rolling delivery schedule
INSERT INTO "Cycle" ("id", "name", "startDate", "endDate", "capacity") VALUES
    ('cycle-29', 'Cycle 29', '2026-07-07T00:00:00.000Z', '2026-07-20T23:59:59.999Z', 21),
    ('cycle-30', 'Cycle 30', '2026-07-21T00:00:00.000Z', '2026-08-03T23:59:59.999Z', 24),
    ('cycle-31', 'Cycle 31', '2026-08-04T00:00:00.000Z', '2026-08-17T23:59:59.999Z', 25)
ON CONFLICT ("id") DO NOTHING;

-- Backfill estimates and cycle scope for the demo workspace
UPDATE "Issue" SET "estimate" = 5, "cycleId" = 'cycle-30' WHERE "id" = 'AMR-128';
UPDATE "Issue" SET "estimate" = 3, "cycleId" = 'cycle-30' WHERE "id" = 'AMR-127';
UPDATE "Issue" SET "estimate" = 2, "cycleId" = 'cycle-30' WHERE "id" = 'AMR-126';
UPDATE "Issue" SET "estimate" = 3, "cycleId" = 'cycle-30' WHERE "id" = 'AMR-125';
UPDATE "Issue" SET "estimate" = 2, "cycleId" = 'cycle-31' WHERE "id" = 'AMR-124';
UPDATE "Issue" SET "estimate" = 5, "cycleId" = 'cycle-31' WHERE "id" = 'AMR-123';
UPDATE "Issue" SET "estimate" = 3, "cycleId" = 'cycle-30' WHERE "id" = 'AMR-122';
UPDATE "Issue" SET "estimate" = 1, "cycleId" = 'cycle-30' WHERE "id" = 'AMR-121';
