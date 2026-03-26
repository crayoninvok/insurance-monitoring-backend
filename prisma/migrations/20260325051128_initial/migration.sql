-- CreateEnum
CREATE TYPE "IsDeleted" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('HRGA', 'FINANCE', 'PROCUREMENT', 'OPEATIONS', 'PLANT', 'INFRASTRUCTURE', 'LOGISTICS', 'TRAINING_CENTER', 'MANAGEMENT');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('DIRECTOR', 'MANAGER', 'STAFF', 'SUPERVISOR', 'JUNIOR_SUPERVISOR', 'SUPERINTENDENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "department" "Department" NOT NULL,
    "position" "Position" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isDeleted" "IsDeleted" NOT NULL DEFAULT 'NO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
