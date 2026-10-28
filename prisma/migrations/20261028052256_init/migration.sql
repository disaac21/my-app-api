-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('OIL', 'MECHANICAL', 'ELECTRICAL', 'DOCUMENTATION', 'TIRES', 'BRAKES', 'FILTERS', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "plate" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "trim" TEXT,
    "color" TEXT,
    "nickname" TEXT,
    "vin" TEXT,
    "engine" TEXT,
    "enginePower" TEXT,
    "transmission" TEXT,
    "fuelType" TEXT DEFAULT '87',
    "tankCapacity" DOUBLE PRECISION,
    "tankCapacityUnit" TEXT DEFAULT 'gal',
    "tirePressure" TEXT,
    "tirePressureUnit" TEXT DEFAULT 'PSI',
    "oilType" TEXT,
    "oilSpecification" TEXT,
    "batteryVoltage" TEXT,
    "ownerId" TEXT,
    "currentOdometer" DOUBLE PRECISION,
    "odometerUnit" TEXT DEFAULT 'mi',
    "registrationNumber" TEXT,
    "registrationExpiry" TIMESTAMP(3),
    "insuranceProvider" TEXT,
    "insurancePolicy" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "emissionsDueDate" TIMESTAMP(3),
    "emissionsStatus" TEXT,
    "assignedTo" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_entries" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "odometer" DOUBLE PRECISION NOT NULL,
    "odometerUnit" TEXT NOT NULL DEFAULT 'mi',
    "tripDistance" DOUBLE PRECISION,
    "tripUnit" TEXT DEFAULT 'mi',
    "volume" DOUBLE PRECISION NOT NULL,
    "volumeUnit" TEXT NOT NULL DEFAULT 'gal',
    "priceTotal" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricePerUnit" DOUBLE PRECISION,
    "station" TEXT,
    "stationName" TEXT,
    "fuelType" TEXT,
    "notes" TEXT,
    "efficiency" DOUBLE PRECISION,
    "efficiencyUnit" TEXT DEFAULT 'MPG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fuel_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_entries" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "odometer" DOUBLE PRECISION,
    "odometerUnit" TEXT DEFAULT 'mi',
    "cost" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "shop" TEXT,
    "provider" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_parts" (
    "id" TEXT NOT NULL,
    "maintenanceEntryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partNumber" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "cost" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'USD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odometer_readings" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "odometer" DOUBLE PRECISION NOT NULL,
    "odometerUnit" TEXT NOT NULL DEFAULT 'mi',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "source" TEXT DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "odometer_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quick_updates" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "odometer" DOUBLE PRECISION,
    "odometerUnit" TEXT DEFAULT 'mi',
    "fuelLevel" DOUBLE PRECISION,
    "fuelLevelUnit" TEXT DEFAULT '%',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quick_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_entries" ADD CONSTRAINT "fuel_entries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_entries" ADD CONSTRAINT "maintenance_entries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_parts" ADD CONSTRAINT "maintenance_parts_maintenanceEntryId_fkey" FOREIGN KEY ("maintenanceEntryId") REFERENCES "maintenance_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odometer_readings" ADD CONSTRAINT "odometer_readings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quick_updates" ADD CONSTRAINT "quick_updates_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
