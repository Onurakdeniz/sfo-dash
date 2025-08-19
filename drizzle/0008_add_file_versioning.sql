-- Add versioning support to company_files

-- New columns for explicit versioning and audit
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "code" varchar(100);
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "version" varchar(50);
ALTER TABLE "company_files" ADD COLUMN IF NOT EXISTS "updated_by" text;

-- FK for updated_by -> user.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'company_files_updated_by_user_id_fk'
  ) THEN
    ALTER TABLE "company_files" 
      ADD CONSTRAINT "company_files_updated_by_user_id_fk"
      FOREIGN KEY ("updated_by") REFERENCES "user"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS "company_files_code_idx" ON "company_files" USING btree ("code");
CREATE INDEX IF NOT EXISTS "company_files_company_code_idx" ON "company_files" USING btree ("company_id", "code");

-- Uniqueness for code+version inside a company (nullable columns allow multiple NULLs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'company_files_company_code_version_unique'
  ) THEN
    ALTER TABLE "company_files" 
      ADD CONSTRAINT "company_files_company_code_version_unique" UNIQUE ("company_id", "code", "version");
  END IF;
END $$;

-- Backfill from JSON metadata if present
UPDATE "company_files" SET "code" = COALESCE("metadata"->>'code', NULL) WHERE "code" IS NULL;
UPDATE "company_files" SET "version" = COALESCE("metadata"->>'version', NULL) WHERE "version" IS NULL;
UPDATE "company_files" SET "updated_by" = "uploaded_by" WHERE "updated_by" IS NULL;


