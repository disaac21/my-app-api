# Hub API - Backend

This is the NestJS + Prisma backend for the Hub UI vehicle management application.

## Setup

1. Install dependencies
```bash
npm install
```

2. Set up environment variables
```bash
cp .env.example .env
```
Update DATABASE_URL with your database credentials.

3. Generate Prisma Client and run migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Run the development server
```bash
npm run start:dev
```

## Database Schema

### Core Models
- **User** - User accounts who own vehicles
- **Vehicle** - Main vehicle/car entity with all principal information (make, model, year, plate, engine specs, registration, insurance, etc.)
- **FuelEntry** - Gas/fuel fill-up records
- **MaintenanceEntry** - Maintenance/service records
- **MaintenancePart** - Parts used in maintenance
- **OdometerReading** - Historical odometer readings
- **QuickUpdate** - Quick odometer/fuel level updates

### Vehicle (Car) Class - Principal Information

The Vehicle model contains all the principal information as seen in the UI:

```prisma
model Vehicle {
  id                String           @id @default(cuid())
  plate             String?          @unique
  make              String
  model             String
  year              Int
  trim              String?
  color             String?
  nickname          String?
  vin               String?          @unique
  engine            String?
  enginePower       String?
  transmission      String?
  fuelType          String?          @default("87")
  tankCapacity      Float?
  tankCapacityUnit  String?          @default("gal")
  tirePressure      String?
  tirePressureUnit  String?          @default("PSI")
  oilType           String?
  oilSpecification  String?
  batteryVoltage    String?
  owner             User?            @relation(fields: [ownerId], references: [id])
  ownerId           String?
  currentOdometer   Float?
  odometerUnit      String?          @default("mi")
  registrationNumber String?
  registrationExpiry DateTime?
  insuranceProvider String?
  insurancePolicy   String?
  insuranceExpiry   DateTime?
  emissionsDueDate  DateTime?
  emissionsStatus   String?
  assignedTo        String?
  imageUrl          String?
  isActive          Boolean          @default(true)
  ...
}
```

## API Endpoints

### Vehicles
- `POST /vehicles` - Create vehicle
- `GET /vehicles` - List all vehicles
- `GET /vehicles/:id` - Get vehicle details
- `GET /vehicles/plate/:plate` - Get vehicle by plate
- `GET /vehicles/:id/stats` - Get vehicle statistics
- `PATCH /vehicles/:id` - Update vehicle
- `DELETE /vehicles/:id` - Soft delete vehicle

### Fuel Entries (Gas)
- `POST /fuel-entries` - Create fuel entry
- `GET /fuel-entries?vehicleId=:id` - List fuel entries (optionally filtered by vehicle)
- `GET /fuel-entries/:id` - Get fuel entry details
- `PATCH /fuel-entries/:id` - Update fuel entry
- `DELETE /fuel-entries/:id` - Delete fuel entry

### Maintenance Entries
- `POST /maintenance-entries` - Create maintenance entry (can include parts)
- `GET /maintenance-entries?vehicleId=:id&type=:type` - List maintenance entries
- `GET /maintenance-entries/:id` - Get maintenance entry details
- `PATCH /maintenance-entries/:id` - Update maintenance entry
- `DELETE /maintenance-entries/:id` - Delete maintenance entry

### Odometer Readings
- `POST /odometer-readings` - Create odometer reading (updates vehicle's current odometer)
- `GET /odometer-readings?vehicleId=:id` - List odometer readings
- `GET /odometer-readings/:id` - Get odometer reading details
- `PATCH /odometer-readings/:id` - Update odometer reading
- `DELETE /odometer-readings/:id` - Delete odometer reading

### Quick Updates
- `POST /quick-updates` - Create quick update (updates vehicle's current odometer)
- `GET /quick-updates?vehicleId=:id` - List quick updates
- `GET /quick-updates/:id` - Get quick update details
- `PATCH /quick-updates/:id` - Update quick update
- `DELETE /quick-updates/:id` - Delete quick update

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio
```

## Maintenance Types
- OIL
- MECHANICAL
- ELECTRICAL
- DOCUMENTATION
- TIRES
- BRAKES
- FILTERS
- OTHER
