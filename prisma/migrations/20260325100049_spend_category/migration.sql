-- CreateEnum
CREATE TYPE "BudgetSpendCategory" AS ENUM ('RAWAT_INAP', 'MCU', 'RAWAT_JALAN', 'BELI_OBAT', 'DOKTER_UMUM', 'OPERASI');

-- AlterTable
ALTER TABLE "BudgetLedger" ADD COLUMN     "spendCategory" "BudgetSpendCategory";
