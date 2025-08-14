-- Drop modules.category and related constraints/indexes; add submodule type already handled in schema
DO $$ BEGIN
  -- Safely drop check constraint if exists
  ALTER TABLE "modules" DROP CONSTRAINT IF EXISTS "modules_category_check";
EXCEPTION WHEN undefined_table THEN
  -- ignore if table missing in some envs
  NULL;
END $$;

-- Drop index on category if exists
DO $$ BEGIN
  DROP INDEX IF EXISTS "modules_category_idx";
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Drop the category column if exists
ALTER TABLE "modules" DROP COLUMN IF EXISTS "category";
-- Add 'submodule' to resource_type check constraint on module_resources
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'module_resources_type_check'
      AND table_name = 'module_resources'
  ) THEN
    ALTER TABLE "module_resources" DROP CONSTRAINT "module_resources_type_check";
  END IF;
END $$;

ALTER TABLE "module_resources"
  ADD CONSTRAINT "module_resources_type_check"
  CHECK (resource_type IN ('page','api','feature','report','action','widget','submodule'));


-- company_files table for storing metadata of files uploaded to Vercel Blob
CREATE TABLE IF NOT EXISTS "company_files" (
    "id" text PRIMARY KEY NOT NULL,
    "company_id" text NOT NULL,
    "uploaded_by" text,
    "name" varchar(255) NOT NULL,
    "blob_url" text NOT NULL,
    "blob_path" text,
    "content_type" varchar(255),
    "size" integer DEFAULT 0 NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "deleted_at" timestamp
);

-- Indexes
CREATE INDEX IF NOT EXISTS "company_files_company_idx" ON "company_files" USING btree ("company_id");
CREATE INDEX IF NOT EXISTS "company_files_created_idx" ON "company_files" USING btree ("created_at");

-- Foreign keys
ALTER TABLE "company_files" ADD CONSTRAINT "company_files_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_files" ADD CONSTRAINT "company_files_uploaded_by_user_id_fk"
  FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
