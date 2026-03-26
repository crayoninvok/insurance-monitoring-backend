-- CreateEnum
CREATE TYPE "BudgetTxnType" AS ENUM ('ALLOCATE', 'SPEND', 'ADJUST');

-- CreateTable
CREATE TABLE "BudgetPolicy" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "annualAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "allocated" DECIMAL(65,30) NOT NULL,
    "spent" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "BudgetTxnType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetPolicy_year_idx" ON "BudgetPolicy"("year");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetPolicy_year_position_key" ON "BudgetPolicy"("year", "position");

-- CreateIndex
CREATE INDEX "BudgetBalance_year_idx" ON "BudgetBalance"("year");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetBalance_userId_year_key" ON "BudgetBalance"("userId", "year");

-- CreateIndex
CREATE INDEX "BudgetLedger_userId_year_idx" ON "BudgetLedger"("userId", "year");

-- CreateIndex
CREATE INDEX "BudgetLedger_year_idx" ON "BudgetLedger"("year");

-- AddForeignKey
ALTER TABLE "BudgetBalance" ADD CONSTRAINT "BudgetBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLedger" ADD CONSTRAINT "BudgetLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
