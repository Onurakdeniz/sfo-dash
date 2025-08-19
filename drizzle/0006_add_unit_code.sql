-- Add optional code field to units to support per-unit short codes
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "code" varchar(20);

-- Index for faster lookups by code
CREATE INDEX IF NOT EXISTS "units_code_idx" ON "units" ("code");

-- Ensure code is unique per department when provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'units_department_code_unique'
  ) THEN
    ALTER TABLE "units" ADD CONSTRAINT "units_department_code_unique" UNIQUE ("department_id", "code");
  END IF;
END$$;


