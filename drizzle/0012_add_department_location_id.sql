-- Add optional location_id to departments and link to company_locations
ALTER TABLE "departments"
  ADD COLUMN IF NOT EXISTS "location_id" text;

-- Foreign key to company_locations(id)
ALTER TABLE "departments"
  ADD CONSTRAINT IF NOT EXISTS "departments_location_id_company_locations_id_fk"
  FOREIGN KEY ("location_id") REFERENCES "public"."company_locations"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Index for faster queries by location
CREATE INDEX IF NOT EXISTS "departments_location_idx" ON "departments" ("location_id");

