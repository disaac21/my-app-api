import { ParamKind, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Params are key/value rows: (kind, key) -> JSON value.
 * This seed is additive and non-destructive: existing keys are left untouched
 * so runtime edits (renamed labels, changed display units) survive a re-seed.
 */
type ParamSeed = {
  kind: ParamKind;
  key: string;
  value: Prisma.InputJsonValue;
};

const unit = (
  label: string,
  symbol: string,
  factorToBase: number,
  isBase: boolean,
  sortOrder: number,
): Prisma.InputJsonObject => ({ label, symbol, factorToBase, isBase, sortOrder });

const option = (label: string, sortOrder: number): Prisma.InputJsonObject => ({
  label,
  sortOrder,
});

const params: ParamSeed[] = [
  // ── units ────────────────────────────────────────────────────────────────
  // factorToBase = how many base units one of these equals.
  // Base rows are immutable: flipping isBase reinterprets every stored value.
  { kind: 'DISTANCE_UNIT', key: 'KM', value: unit('Kilometers', 'km', 1, true, 0) },
  { kind: 'DISTANCE_UNIT', key: 'MI', value: unit('Miles', 'mi', 1.609344, false, 1) },

  { kind: 'VOLUME_UNIT', key: 'L', value: unit('Litres', 'L', 1, true, 0) },
  { kind: 'VOLUME_UNIT', key: 'GAL_US', value: unit('Gallons (US)', 'gal', 3.785411784, false, 1) },
  { kind: 'VOLUME_UNIT', key: 'GAL_UK', value: unit('Gallons (UK)', 'gal', 4.54609, false, 2) },

  { kind: 'PRESSURE_UNIT', key: 'KPA', value: unit('Kilopascals', 'kPa', 1, true, 0) },
  { kind: 'PRESSURE_UNIT', key: 'PSI', value: unit('Pounds per square inch', 'psi', 6.894757, false, 1) },
  { kind: 'PRESSURE_UNIT', key: 'BAR', value: unit('Bar', 'bar', 100, false, 2) },

  // ── app settings ─────────────────────────────────────────────────────────
  // Which unit/currency the UI shows. Storage always uses the base unit.
  { kind: 'SETTING', key: 'default_distance_unit', value: 'KM' },
  { kind: 'SETTING', key: 'default_volume_unit', value: 'L' },
  { kind: 'SETTING', key: 'default_pressure_unit', value: 'KPA' },
  { kind: 'SETTING', key: 'default_currency', value: 'USD' },

  // ── value sets ───────────────────────────────────────────────────────────
  { kind: 'CURRENCY', key: 'USD', value: { ...option('US Dollar', 0), symbol: '$' } },
  { kind: 'CURRENCY', key: 'EUR', value: { ...option('Euro', 1), symbol: '€' } },
  { kind: 'CURRENCY', key: 'GBP', value: { ...option('Pound Sterling', 2), symbol: '£' } },

  { kind: 'FUEL_TYPE', key: 'GASOLINE', value: option('Gasoline / Petrol', 0) },
  { kind: 'FUEL_TYPE', key: 'DIESEL', value: option('Diesel', 1) },
  { kind: 'FUEL_TYPE', key: 'ELECTRIC', value: option('Electric', 2) },
  { kind: 'FUEL_TYPE', key: 'HYBRID', value: option('Hybrid', 3) },
  { kind: 'FUEL_TYPE', key: 'PLUGIN_HYBRID', value: option('Plug-in hybrid', 4) },
  { kind: 'FUEL_TYPE', key: 'E85', value: option('E85', 5) },
  { kind: 'FUEL_TYPE', key: 'CNG', value: option('Compressed natural gas', 6) },
  { kind: 'FUEL_TYPE', key: 'LPG', value: option('Liquid petroleum gas', 7) },
  { kind: 'FUEL_TYPE', key: 'HYDROGEN', value: option('Hydrogen', 8) },

  { kind: 'TRANSMISSION_TYPE', key: 'MANUAL', value: option('Manual', 0) },
  { kind: 'TRANSMISSION_TYPE', key: 'AUTOMATIC', value: option('Automatic', 1) },
  { kind: 'TRANSMISSION_TYPE', key: 'CVT', value: option('CVT', 2) },
  { kind: 'TRANSMISSION_TYPE', key: 'DCT', value: option('Dual clutch', 3) },
  { kind: 'TRANSMISSION_TYPE', key: 'AMT', value: option('Automated manual', 4) },
  { kind: 'TRANSMISSION_TYPE', key: 'SINGLE_SPEED', value: option('Single speed', 5) },

  { kind: 'DRIVE_TYPE', key: 'FWD', value: option('Front-wheel drive', 0) },
  { kind: 'DRIVE_TYPE', key: 'RWD', value: option('Rear-wheel drive', 1) },
  { kind: 'DRIVE_TYPE', key: 'AWD', value: option('All-wheel drive', 2) },
  { kind: 'DRIVE_TYPE', key: 'FOUR_WD', value: option('Four-wheel drive', 3) },

  { kind: 'MAINTENANCE_TYPE', key: 'OIL', value: option('Oil', 0) },
  { kind: 'MAINTENANCE_TYPE', key: 'MECHANICAL', value: option('Mechanical', 1) },
  { kind: 'MAINTENANCE_TYPE', key: 'ELECTRICAL', value: option('Electrical', 2) },
  { kind: 'MAINTENANCE_TYPE', key: 'TIRES', value: option('Tires', 3) },
  { kind: 'MAINTENANCE_TYPE', key: 'BRAKES', value: option('Brakes', 4) },
  { kind: 'MAINTENANCE_TYPE', key: 'FILTERS', value: option('Filters', 5) },
  { kind: 'MAINTENANCE_TYPE', key: 'COOLING', value: option('Cooling', 6) },
  { kind: 'MAINTENANCE_TYPE', key: 'TRANSMISSION', value: option('Transmission', 7) },
  { kind: 'MAINTENANCE_TYPE', key: 'SUSPENSION', value: option('Suspension', 8) },
  { kind: 'MAINTENANCE_TYPE', key: 'EXHAUST', value: option('Exhaust', 9) },
  { kind: 'MAINTENANCE_TYPE', key: 'BODY', value: option('Body', 10) },
  { kind: 'MAINTENANCE_TYPE', key: 'INSPECTION', value: option('Inspection', 11) },
  { kind: 'MAINTENANCE_TYPE', key: 'OTHER', value: option('Other', 99) },

  { kind: 'DOCUMENT_GROUP', key: 'PERSONAL', value: option('Personal', 0) },
  { kind: 'DOCUMENT_GROUP', key: 'VEHICLE', value: option('Vehicle', 1) },

  { kind: 'DOCUMENT_TYPE', key: 'DRIVER_LICENSE', value: option("Driver's licence", 0) },
  { kind: 'DOCUMENT_TYPE', key: 'INSURANCE', value: option('Insurance', 1) },
  { kind: 'DOCUMENT_TYPE', key: 'REGISTRATION', value: option('Car registration', 2) },

  { kind: 'READING_SOURCE', key: 'MANUAL', value: option('Manual entry', 0) },
  { kind: 'READING_SOURCE', key: 'FUEL_ENTRY', value: option('Fuel entry', 1) },
  { kind: 'READING_SOURCE', key: 'MAINTENANCE', value: option('Maintenance', 2) },
  { kind: 'READING_SOURCE', key: 'QUICK_UPDATE', value: option('Quick update', 3) },
  { kind: 'READING_SOURCE', key: 'OBD', value: option('OBD device', 4) },
  { kind: 'READING_SOURCE', key: 'IMPORT', value: option('Imported', 5) },
];

/**
 * Starter catalogue. Names are stored in canonical Title Case so the
 * case-sensitive @unique on makes.name stays meaningful — make sure the
 * create/update service does the same normalisation.
 */
const catalogue: Record<string, string[]> = {
  Toyota: ['Corolla', 'Camry', 'RAV4', 'Hilux', 'Land Cruiser', 'Yaris', 'Prius', 'Fortuner'],
  Honda: ['Civic', 'Accord', 'CR-V', 'HR-V', 'Jazz', 'Pilot'],
  Ford: ['F-150', 'Ranger', 'Focus', 'Fiesta', 'Mustang', 'Explorer', 'Escape'],
  Chevrolet: ['Silverado', 'Equinox', 'Malibu', 'Cruze', 'Tahoe', 'Camaro'],
  Nissan: ['Altima', 'Sentra', 'Rogue', 'Navara', 'Patrol', 'Leaf'],
  Hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'i30', 'Kona'],
  Kia: ['Rio', 'Cerato', 'Sportage', 'Sorento', 'Picanto', 'Seltos'],
  Mazda: ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-30', 'MX-5'],
  Subaru: ['Impreza', 'Legacy', 'Forester', 'Outback', 'Crosstrek'],
  Volkswagen: ['Golf', 'Polo', 'Passat', 'Tiguan', 'Jetta', 'Amarok'],
  BMW: ['1 Series', '3 Series', '5 Series', 'X1', 'X3', 'X5'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'GLE'],
  Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  Volvo: ['S60', 'V60', 'XC40', 'XC60', 'XC90'],
  Peugeot: ['208', '308', '2008', '3008', '5008'],
  Renault: ['Clio', 'Megane', 'Captur', 'Duster', 'Kwid'],
  Fiat: ['500', 'Panda', 'Tipo', 'Strada'],
  Jeep: ['Wrangler', 'Cherokee', 'Grand Cherokee', 'Compass', 'Renegade'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover', 'Range Rover Sport'],
  Porsche: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  Lexus: ['IS', 'ES', 'RX', 'NX', 'LX'],
  Mitsubishi: ['Lancer', 'Outlander', 'Pajero', 'Triton', 'ASX'],
  Suzuki: ['Swift', 'Vitara', 'Jimny', 'Baleno', 'Ertiga'],
  Isuzu: ['D-Max', 'MU-X'],
  GMC: ['Sierra', 'Canyon', 'Yukon', 'Acadia'],
  Ram: ['1500', '2500', '3500'],
  Dodge: ['Charger', 'Challenger', 'Durango'],
  Cadillac: ['CT4', 'CT5', 'Escalade', 'XT5'],
  Genesis: ['G70', 'G80', 'GV70', 'GV80'],
  Skoda: ['Octavia', 'Superb', 'Kodiaq', 'Karoq'],
  Dacia: ['Sandero', 'Duster', 'Jogger'],
};

async function seedParams() {
  const existing = await prisma.param.findMany({
    select: { kind: true, key: true },
  });
  const have = new Set(existing.map((p) => `${p.kind}::${p.key}`));

  let created = 0;
  for (const p of params) {
    if (have.has(`${p.kind}::${p.key}`)) continue;
    await prisma.param.create({ data: { kind: p.kind, key: p.key, value: p.value } });
    created += 1;
  }
  console.log(`params: ${created} created, ${have.size} already present`);
}

async function seedCatalogue() {
  let makes = 0;
  let models = 0;

  for (const [makeName, modelNames] of Object.entries(catalogue)) {
    let make = await prisma.make.findFirst({
      where: { name: { equals: makeName, mode: 'insensitive' } },
    });

    if (!make) {
      make = await prisma.make.create({ data: { name: makeName } });
      makes += 1;
    }

    const existing = await prisma.model.findMany({
      where: { makeId: make.id },
      select: { name: true },
    });
    const have = new Set(existing.map((m) => m.name.toLowerCase()));

    for (const modelName of modelNames) {
      if (have.has(modelName.toLowerCase())) continue;
      await prisma.model.create({ data: { makeId: make.id, name: modelName } });
      models += 1;
    }
  }

  console.log(`catalogue: ${makes} makes, ${models} models created`);
}

async function main() {
  await seedParams();
  await seedCatalogue();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
