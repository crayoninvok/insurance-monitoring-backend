-- Rename enum value (PostgreSQL 10+). Preserves existing rows that used STAFF.
ALTER TYPE "Position" RENAME VALUE 'STAFF' TO 'WORKER';
