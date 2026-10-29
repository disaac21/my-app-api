import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * `params` holds one row per kind. `value` is an ordered array of options:
 *   key:   "FUEL_TYPE"
 *   value: [{ "key": "GASOLINE", "label": "Gasoline / Petrol" }, ...]
 *
 * Order is display order; the first entry is the default. Re-seeding is
 * additive: an existing row is never overwritten, so your edits survive.
 */
type Option = {
  key: string;
  label: string;
  symbol?: string;
  /** Only meaningful on DOCUMENT_TYPE: which DOCUMENT_GROUP the type belongs to. */
  groups?: string[];
};

const unit = (key: string, label: string, symbol: string): Option => ({ key, label, symbol });
const option = (key: string, label: string, groups?: string[]): Option => ({
  key,
  label,
  ...(groups ? { groups } : {}),
});

type ParamSeed = { key: string; value: Option[] };

const params: ParamSeed[] = [
  {
    key: 'DISTANCE_UNIT',
    value: [
      unit('KM', 'Kilometers', 'km'),
      unit('MI', 'Miles', 'mi'),
    ],
  },
  {
    key: 'VOLUME_UNIT',
    value: [
      unit('L', 'Litres', 'L'),
      unit('GAL_US', 'Gallons (US)', 'gal'),
      unit('GAL_UK', 'Gallons (UK)', 'gal'),
    ],
  },
  {
    key: 'PRESSURE_UNIT',
    value: [
      unit('KPA', 'Kilopascals', 'kPa'),
      unit('PSI', 'Pounds per square inch', 'psi'),
      unit('BAR', 'Bar', 'bar'),
    ],
  },
  {
    key: 'CURRENCY',
    value: [
      unit('USD', 'US Dollar', '$'),
      unit('EUR', 'Euro', '€'),
      unit('GBP', 'Pound Sterling', '£'),
    ],
  },
  {
    key: 'FUEL_TYPE',
    value: [
      option('GASOLINE', 'Gasoline / Petrol'),
      option('DIESEL', 'Diesel'),
      option('ELECTRIC', 'Electric'),
      option('HYBRID', 'Hybrid'),
      option('PLUGIN_HYBRID', 'Plug-in hybrid'),
      option('E85', 'E85'),
      option('CNG', 'Compressed natural gas'),
      option('LPG', 'Liquid petroleum gas'),
      option('HYDROGEN', 'Hydrogen'),
    ],
  },
  {
    key: 'TRANSMISSION_TYPE',
    value: [
      option('MANUAL', 'Manual'),
      option('AUTOMATIC', 'Automatic'),
      option('CVT', 'CVT'),
      option('DCT', 'Dual clutch'),
      option('AMT', 'Automated manual'),
      option('SINGLE_SPEED', 'Single speed'),
    ],
  },
  {
    key: 'DRIVE_TYPE',
    value: [
      option('FWD', 'Front-wheel drive'),
      option('RWD', 'Rear-wheel drive'),
      option('AWD', 'All-wheel drive'),
      option('FOUR_WD', 'Four-wheel drive'),
    ],
  },
  {
    key: 'MAINTENANCE_TYPE',
    value: [
      option('OIL', 'Oil'),
      option('MECHANICAL', 'Mechanical'),
      option('ELECTRICAL', 'Electrical'),
      option('TIRES', 'Tires'),
      option('BRAKES', 'Brakes'),
      option('FILTERS', 'Filters'),
      option('COOLING', 'Cooling'),
      option('TRANSMISSION', 'Transmission'),
      option('SUSPENSION', 'Suspension'),
      option('EXHAUST', 'Exhaust'),
      option('BODY', 'Body'),
      option('INSPECTION', 'Inspection'),
      option('OTHER', 'Other'),
    ],
  },
  {
    key: 'DOCUMENT_GROUP',
    value: [
      option('PERSONAL', 'Personal'),
      option('VEHICLE', 'Vehicle'),
    ],
  },
  {
    key: 'DOCUMENT_TYPE',
    value: [
      // A licence belongs to the driver, never to a car; insurance and
      // registration always do. The API enforces this mapping on write.
      option('DRIVER_LICENSE', "Driver's licence", ['PERSONAL']),
      option('INSURANCE', 'Insurance', ['VEHICLE']),
      option('REGISTRATION', 'Car registration', ['VEHICLE']),
    ],
  },
  {
    key: 'READING_SOURCE',
    value: [
      option('MANUAL', 'Manual entry'),
      option('FUEL_ENTRY', 'Fuel entry'),
      option('MAINTENANCE', 'Maintenance'),
      option('QUICK_UPDATE', 'Quick update'),
      option('OBD', 'OBD device'),
      option('IMPORT', 'Imported'),
    ],
  },
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
  const existing = await prisma.param.findMany({ select: { key: true } });
  const have = new Set(existing.map((p) => p.key));

  let created = 0;
  for (const p of params) {
    if (have.has(p.key)) continue;
    await prisma.param.create({
      data: { key: p.key, value: p.value as unknown as Prisma.InputJsonValue },
    });
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
