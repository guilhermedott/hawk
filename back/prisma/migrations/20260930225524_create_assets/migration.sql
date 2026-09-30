-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('computer', 'notebook', 'server', 'switch');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('online', 'offline', 'maintenance');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'online',
    "department" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "notes" TEXT,
    "os" TEXT NOT NULL,
    "cpuModel" TEXT NOT NULL,
    "cpuCores" INTEGER NOT NULL,
    "totalRamGb" INTEGER NOT NULL,
    "totalDiskGb" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "bootedAt" TIMESTAMP(3) NOT NULL,
    "seed" INTEGER NOT NULL,
    "loadFactor" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_tag_key" ON "assets"("tag");
