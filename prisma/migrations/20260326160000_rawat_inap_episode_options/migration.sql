-- CreateTable
CREATE TABLE "RawatInapEpisodeOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawatInapEpisodeOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawatInapEpisodeOption_name_key" ON "RawatInapEpisodeOption"("name");

-- AlterTable (nullable first for backfill)
ALTER TABLE "RawatInapEpisode" ADD COLUMN "rawatInapEpisodeOptionId" TEXT;

-- Seed options from existing free-text labels
INSERT INTO "RawatInapEpisodeOption" ("id", "name", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, s.label, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "sickConditionLabel" AS label FROM "RawatInapEpisode") s;

-- Link episodes to options by name
UPDATE "RawatInapEpisode" AS e
SET "rawatInapEpisodeOptionId" = o."id"
FROM "RawatInapEpisodeOption" AS o
WHERE o."name" = e."sickConditionLabel";

-- Drop old column
ALTER TABLE "RawatInapEpisode" DROP COLUMN "sickConditionLabel";

-- Enforce FK + NOT NULL
ALTER TABLE "RawatInapEpisode" ALTER COLUMN "rawatInapEpisodeOptionId" SET NOT NULL;

ALTER TABLE "RawatInapEpisode" ADD CONSTRAINT "RawatInapEpisode_rawatInapEpisodeOptionId_fkey" FOREIGN KEY ("rawatInapEpisodeOptionId") REFERENCES "RawatInapEpisodeOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "RawatInapEpisode_rawatInapEpisodeOptionId_idx" ON "RawatInapEpisode"("rawatInapEpisodeOptionId");
