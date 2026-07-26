-- CreateTable
CREATE TABLE "SavedView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL DEFAULT 'Amanuel R.',
    "query" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ALL',
    "priority" TEXT NOT NULL DEFAULT 'ALL',
    "assignee" TEXT NOT NULL DEFAULT 'ALL',
    "sort" TEXT NOT NULL DEFAULT 'NEWEST',
    "labelId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SavedView_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedView_name_key" ON "SavedView"("name");

-- CreateIndex
CREATE INDEX "SavedView_owner_idx" ON "SavedView"("owner");

-- CreateIndex
CREATE INDEX "SavedView_labelId_idx" ON "SavedView"("labelId");

-- Seed useful workspace views
INSERT INTO "SavedView" (
    "id", "name", "owner", "query", "status", "priority", "assignee", "sort", "labelId", "updatedAt"
) VALUES
    ('view-urgent', 'Urgent active work', 'Amanuel R.', '', 'ACTIVE', 'URGENT', 'ALL', 'NEWEST', NULL, CURRENT_TIMESTAMP),
    ('view-customer', 'Customer impact', 'Amanuel R.', '', 'ACTIVE', 'ALL', 'ALL', 'NEWEST', 'label-customer', CURRENT_TIMESTAMP);
