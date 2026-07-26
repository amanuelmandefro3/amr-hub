-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "dueDate" DATETIME;

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IssueLabel" (
    "issueId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    CONSTRAINT "IssueLabel_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IssueLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("issueId", "labelId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Label_name_key" ON "Label"("name");

-- CreateIndex
CREATE INDEX "IssueLabel_labelId_idx" ON "IssueLabel"("labelId");

-- Seed workspace labels
INSERT OR IGNORE INTO "Label" ("id", "name", "color") VALUES
    ('label-customer', 'Customer impact', '#dc2626'),
    ('label-frontend', 'Frontend', '#2563eb'),
    ('label-backend', 'Backend', '#059669'),
    ('label-reliability', 'Reliability', '#d97706'),
    ('label-design', 'Design', '#7c3aed');

-- Backfill planning data for the demo workspace
UPDATE "Issue" SET "dueDate" = '2026-07-27T12:00:00.000Z' WHERE "id" = 'AMR-128';
UPDATE "Issue" SET "dueDate" = '2026-07-30T12:00:00.000Z' WHERE "id" = 'AMR-127';
UPDATE "Issue" SET "dueDate" = '2026-07-28T12:00:00.000Z' WHERE "id" = 'AMR-125';
UPDATE "Issue" SET "dueDate" = '2026-08-03T12:00:00.000Z' WHERE "id" = 'AMR-124';

INSERT OR IGNORE INTO "IssueLabel" ("issueId", "labelId") VALUES
    ('AMR-128', 'label-customer'),
    ('AMR-128', 'label-backend'),
    ('AMR-127', 'label-frontend'),
    ('AMR-125', 'label-frontend'),
    ('AMR-125', 'label-reliability'),
    ('AMR-124', 'label-customer'),
    ('AMR-123', 'label-backend'),
    ('AMR-122', 'label-frontend'),
    ('AMR-121', 'label-design');
