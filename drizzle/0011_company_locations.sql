-- Create company_locations table
CREATE TABLE IF NOT EXISTS "company_locations" (
    "id" text PRIMARY KEY NOT NULL,
    "company_id" text NOT NULL,
    "code" varchar(50),
    "name" varchar(255) NOT NULL,
    "location_type" varchar(50),
    "phone" varchar(20),
    "email" varchar(255),
    "address" text,
    "district" varchar(100),
    "city" varchar(100),
    "postal_code" varchar(10),
    "country" varchar(100) DEFAULT 'Türkiye' NOT NULL,
    "is_headquarters" boolean DEFAULT false NOT NULL,
    "notes" text,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "deleted_at" timestamp,
    CONSTRAINT "company_locations_company_fkey" FOREIGN KEY ("company_id") REFERENCES companies("id") ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "company_locations_company_idx" ON "company_locations" ("company_id");
CREATE INDEX IF NOT EXISTS "company_locations_city_idx" ON "company_locations" ("city");
CREATE INDEX IF NOT EXISTS "company_locations_hq_idx" ON "company_locations" ("is_headquarters");

-- Uniques
CREATE UNIQUE INDEX IF NOT EXISTS "company_locations_company_name_unique" ON "company_locations" ("company_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "company_locations_company_code_unique" ON "company_locations" ("company_id", "code");

-- Checks
ALTER TABLE "company_locations"
  ADD CONSTRAINT IF NOT EXISTS company_locations_email_check CHECK (
    email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

ALTER TABLE "company_locations"
  ADD CONSTRAINT IF NOT EXISTS company_locations_phone_check CHECK (
    phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'
  );


