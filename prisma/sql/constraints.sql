-- Constraints Prisma cannot express in schema.prisma.
-- Append this to the generated init migration (or run it right after
-- `prisma migrate dev`). CHECK constraints and triggers are not managed by
-- Prisma's diff engine, so they survive future migrations.

-- ── vehicles ────────────────────────────────────────────────────────────────
ALTER TABLE "vehicles"
  ADD CONSTRAINT "vehicles_year_check"
    CHECK ("year" BETWEEN 1886 AND 2100),
  ADD CONSTRAINT "vehicles_color_hex_check"
    CHECK ("colorHex" IS NULL OR "colorHex" ~ '^#[0-9A-Fa-f]{6}$');

-- ── readings ────────────────────────────────────────────────────────────────
-- A reading with neither an odometer nor a fuel level carries no information.
ALTER TABLE "vehicle_readings"
  ADD CONSTRAINT "vehicle_readings_has_measurement"
    CHECK ("odometer" IS NOT NULL OR "fuelLevelPct" IS NOT NULL),
  ADD CONSTRAINT "vehicle_readings_fuel_level_range"
    CHECK ("fuelLevelPct" IS NULL OR "fuelLevelPct" BETWEEN 0 AND 100);

-- ── fuel entries ────────────────────────────────────────────────────────────
ALTER TABLE "fuel_entries"
  ADD CONSTRAINT "fuel_entries_volume_positive"
    CHECK ("volume" > 0),
  ADD CONSTRAINT "fuel_entries_price_non_negative"
    CHECK ("priceTotal" >= 0),
  ADD CONSTRAINT "fuel_entries_odometer_non_negative"
    CHECK ("odometer" >= 0);

-- ── maintenance ─────────────────────────────────────────────────────────────
ALTER TABLE "maintenance_entries"
  ADD CONSTRAINT "maintenance_entries_odometer_non_negative"
    CHECK ("odometer" IS NULL OR "odometer" >= 0);

ALTER TABLE "maintenance_plans"
  ADD CONSTRAINT "maintenance_plans_interval_positive"
    CHECK (
      ("intervalDistance" IS NULL OR "intervalDistance" > 0) AND
      ("intervalMonths"   IS NULL OR "intervalMonths"   > 0)
    );

-- ── documents ───────────────────────────────────────────────────────────────
-- A personal document (driver's licence) must NOT be tied to a vehicle;
-- a vehicle document (insurance, registration) must be. The group is a params
-- row, so this cannot be a plain CHECK.
CREATE OR REPLACE FUNCTION "check_document_group"() RETURNS trigger AS $$
DECLARE
  group_key text;
BEGIN
  SELECT key INTO group_key FROM "params" WHERE id = NEW."groupId";

  IF group_key = 'VEHICLE' AND NEW."vehicleId" IS NULL THEN
    RAISE EXCEPTION 'vehicle document requires a vehicleId';
  END IF;

  IF group_key = 'PERSONAL' AND NEW."vehicleId" IS NOT NULL THEN
    RAISE EXCEPTION 'personal document must not reference a vehicle';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "vehicle_documents_group_check" ON "vehicle_documents";
CREATE TRIGGER "vehicle_documents_group_check"
  BEFORE INSERT OR UPDATE ON "vehicle_documents"
  FOR EACH ROW EXECUTE FUNCTION "check_document_group"();
