-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StaffUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mailAppPassword" TEXT,
    "role" TEXT NOT NULL DEFAULT 'agent',
    "area" TEXT NOT NULL DEFAULT 'tecnologia',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_StaffUser" ("active", "createdAt", "email", "id", "mailAppPassword", "name", "passwordHash", "role", "updatedAt") SELECT "active", "createdAt", "email", "id", "mailAppPassword", "name", "passwordHash", "role", "updatedAt" FROM "StaffUser";
DROP TABLE "StaffUser";
ALTER TABLE "new_StaffUser" RENAME TO "StaffUser";
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");
CREATE TABLE "new_Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "landingUrl" TEXT NOT NULL,
    "reporterEmail" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "area" TEXT NOT NULL DEFAULT 'tecnologia',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedToId" TEXT,
    "createdById" TEXT,
    "resolutionNotes" TEXT,
    "resolutionAt" DATETIME,
    "dueAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "StaffUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ticket" ("assignedToId", "category", "closedAt", "code", "createdAt", "createdById", "description", "dueAt", "id", "landingUrl", "priority", "reporterEmail", "resolutionAt", "resolutionNotes", "status", "title", "updatedAt") SELECT "assignedToId", "category", "closedAt", "code", "createdAt", "createdById", "description", "dueAt", "id", "landingUrl", "priority", "reporterEmail", "resolutionAt", "resolutionNotes", "status", "title", "updatedAt" FROM "Ticket";
DROP TABLE "Ticket";
ALTER TABLE "new_Ticket" RENAME TO "Ticket";
CREATE UNIQUE INDEX "Ticket_code_key" ON "Ticket"("code");
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");
CREATE INDEX "Ticket_area_idx" ON "Ticket"("area");
CREATE INDEX "Ticket_dueAt_idx" ON "Ticket"("dueAt");
CREATE INDEX "Ticket_assignedToId_idx" ON "Ticket"("assignedToId");
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
