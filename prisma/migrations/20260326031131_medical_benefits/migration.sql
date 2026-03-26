-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('RAWAT_JALAN', 'RAWAT_INAP', 'MELAHIRKAN');

-- CreateEnum
CREATE TYPE "RawatInapServiceType" AS ENUM ('TARIF_KAMAR_DAYS', 'TANPA_OPERASI', 'OPERASI');

-- AlterTable
ALTER TABLE "BudgetLedger" ADD COLUMN     "benefitType" "BenefitType",
ADD COLUMN     "rawatInapEpisodeId" TEXT,
ADD COLUMN     "rawatInapServiceType" "RawatInapServiceType",
ADD COLUMN     "rawatJalanMedicalId" TEXT;

-- CreateTable
CREATE TABLE "RawatJalanPolicy" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "annualAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawatJalanPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MelahirkanPolicy" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "annualAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MelahirkanPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawatInapPolicy" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "serviceType" "RawatInapServiceType" NOT NULL,
    "capAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawatInapPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawatJalanBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "allocated" DECIMAL(65,30) NOT NULL,
    "spent" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawatJalanBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MelahirkanBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "allocated" DECIMAL(65,30) NOT NULL,
    "spent" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MelahirkanBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawatJalanMedical" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawatJalanMedical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawatInapEpisode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sickConditionLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawatInapEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawatInapEpisodeBalance" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "serviceType" "RawatInapServiceType" NOT NULL,
    "allocated" DECIMAL(65,30) NOT NULL,
    "spent" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawatInapEpisodeBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RawatJalanPolicy_year_idx" ON "RawatJalanPolicy"("year");

-- CreateIndex
CREATE UNIQUE INDEX "RawatJalanPolicy_year_position_key" ON "RawatJalanPolicy"("year", "position");

-- CreateIndex
CREATE INDEX "MelahirkanPolicy_year_idx" ON "MelahirkanPolicy"("year");

-- CreateIndex
CREATE UNIQUE INDEX "MelahirkanPolicy_year_position_key" ON "MelahirkanPolicy"("year", "position");

-- CreateIndex
CREATE INDEX "RawatInapPolicy_year_idx" ON "RawatInapPolicy"("year");

-- CreateIndex
CREATE UNIQUE INDEX "RawatInapPolicy_year_position_serviceType_key" ON "RawatInapPolicy"("year", "position", "serviceType");

-- CreateIndex
CREATE INDEX "RawatJalanBalance_year_idx" ON "RawatJalanBalance"("year");

-- CreateIndex
CREATE UNIQUE INDEX "RawatJalanBalance_userId_year_key" ON "RawatJalanBalance"("userId", "year");

-- CreateIndex
CREATE INDEX "MelahirkanBalance_year_idx" ON "MelahirkanBalance"("year");

-- CreateIndex
CREATE UNIQUE INDEX "MelahirkanBalance_userId_year_key" ON "MelahirkanBalance"("userId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "RawatJalanMedical_name_key" ON "RawatJalanMedical"("name");

-- CreateIndex
CREATE INDEX "RawatInapEpisode_userId_year_idx" ON "RawatInapEpisode"("userId", "year");

-- CreateIndex
CREATE INDEX "RawatInapEpisode_year_idx" ON "RawatInapEpisode"("year");

-- CreateIndex
CREATE INDEX "RawatInapEpisodeBalance_serviceType_idx" ON "RawatInapEpisodeBalance"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "RawatInapEpisodeBalance_episodeId_serviceType_key" ON "RawatInapEpisodeBalance"("episodeId", "serviceType");

-- CreateIndex
CREATE INDEX "BudgetLedger_benefitType_year_idx" ON "BudgetLedger"("benefitType", "year");

-- AddForeignKey
ALTER TABLE "RawatJalanBalance" ADD CONSTRAINT "RawatJalanBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MelahirkanBalance" ADD CONSTRAINT "MelahirkanBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawatInapEpisode" ADD CONSTRAINT "RawatInapEpisode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawatInapEpisodeBalance" ADD CONSTRAINT "RawatInapEpisodeBalance_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "RawatInapEpisode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLedger" ADD CONSTRAINT "BudgetLedger_rawatJalanMedicalId_fkey" FOREIGN KEY ("rawatJalanMedicalId") REFERENCES "RawatJalanMedical"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLedger" ADD CONSTRAINT "BudgetLedger_rawatInapEpisodeId_fkey" FOREIGN KEY ("rawatInapEpisodeId") REFERENCES "RawatInapEpisode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
