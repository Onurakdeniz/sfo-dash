-- File Templates, Versions, and Attachments schema

-- Templates
CREATE TABLE IF NOT EXISTS "company_file_templates" (
  "id" text PRIMARY KEY,
  "company_id" text NOT NULL,
  "code" varchar(100),
  "name" varchar(255) NOT NULL,
  "category" varchar(100),
  "description" text,
  "created_by" text,
  "updated_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

CREATE INDEX IF NOT EXISTS "cft_company_idx" ON "company_file_templates" USING btree ("company_id");
CREATE UNIQUE INDEX IF NOT EXISTS "cft_company_code_unique" ON "company_file_templates" ("company_id", "code");

ALTER TABLE "company_file_templates"
  ADD CONSTRAINT "cft_company_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;
ALTER TABLE "company_file_templates"
  ADD CONSTRAINT "cft_created_by_user_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL;
ALTER TABLE "company_file_templates"
  ADD CONSTRAINT "cft_updated_by_user_fk" FOREIGN KEY ("updated_by") REFERENCES "user"("id") ON DELETE SET NULL;

-- Versions
CREATE TABLE IF NOT EXISTS "company_file_versions" (
  "id" text PRIMARY KEY,
  "template_id" text NOT NULL,
  "version" varchar(50),
  "name" varchar(255) NOT NULL,
  "blob_url" text NOT NULL,
  "blob_path" text,
  "content_type" varchar(255),
  "size" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb,
  "is_current" boolean DEFAULT false NOT NULL,
  "created_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cfv_template_idx" ON "company_file_versions" USING btree ("template_id");
CREATE UNIQUE INDEX IF NOT EXISTS "cfv_template_version_unique" ON "company_file_versions" ("template_id", "version");

ALTER TABLE "company_file_versions"
  ADD CONSTRAINT "cfv_template_fk" FOREIGN KEY ("template_id") REFERENCES "company_file_templates"("id") ON DELETE CASCADE;
ALTER TABLE "company_file_versions"
  ADD CONSTRAINT "cfv_created_by_user_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL;

-- Attachments
CREATE TABLE IF NOT EXISTS "company_file_attachments" (
  "id" text PRIMARY KEY,
  "version_id" text NOT NULL,
  "name" varchar(255) NOT NULL,
  "blob_url" text NOT NULL,
  "blob_path" text,
  "content_type" varchar(255),
  "size" integer DEFAULT 0 NOT NULL,
  "created_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "cfa_version_idx" ON "company_file_attachments" USING btree ("version_id");

ALTER TABLE "company_file_attachments"
  ADD CONSTRAINT "cfa_version_fk" FOREIGN KEY ("version_id") REFERENCES "company_file_versions"("id") ON DELETE CASCADE;
ALTER TABLE "company_file_attachments"
  ADD CONSTRAINT "cfa_created_by_user_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL;

-- Backfill templates and versions from existing company_files (idempotent)
DO $$
DECLARE
  rec RECORD;
  tpl_id text;
  ver_id text;
BEGIN
  -- Create templates for each distinct (company_id, COALESCE(code, name))
  FOR rec IN (
    SELECT DISTINCT cf.company_id, COALESCE(cf.code, (cf.metadata->>'code')) AS code,
           cf.name AS any_name
    FROM company_files cf
    WHERE cf.deleted_at IS NULL
  ) LOOP
    tpl_id := 'ctpl_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 8);
    -- Avoid duplicates: check existing
    IF NOT EXISTS (
      SELECT 1 FROM company_file_templates t WHERE t.company_id = rec.company_id AND ((t.code IS NOT DISTINCT FROM rec.code))
    ) THEN
      INSERT INTO company_file_templates (id, company_id, code, name, created_at, updated_at)
      VALUES (tpl_id, rec.company_id, rec.code, COALESCE(rec.code, rec.any_name), now(), now());
    END IF;
  END LOOP;

  -- Insert versions from company_files
  FOR rec IN (
    SELECT cf.*, COALESCE(cf.code, (cf.metadata->>'code')) AS code_val, COALESCE(cf.version, (cf.metadata->>'version')) AS ver_val
    FROM company_files cf
    WHERE cf.deleted_at IS NULL
  ) LOOP
    SELECT id INTO tpl_id FROM company_file_templates t
      WHERE t.company_id = rec.company_id AND ((t.code IS NOT DISTINCT FROM rec.code_val))
      LIMIT 1;
    IF tpl_id IS NULL THEN
      -- create template if missing
      tpl_id := 'ctpl_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 8);
      INSERT INTO company_file_templates (id, company_id, code, name, created_at, updated_at)
      VALUES (tpl_id, rec.company_id, rec.code_val, COALESCE(rec.code_val, rec.name), now(), now());
    END IF;
    ver_id := 'cver_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 8);
    BEGIN
      INSERT INTO company_file_versions (
        id, template_id, version, name, blob_url, blob_path, content_type, size, metadata, created_by, created_at, updated_at
      ) VALUES (
        ver_id, tpl_id, rec.ver_val, rec.name, rec.blob_url, rec.blob_path, rec.content_type, rec.size, rec.metadata, rec.uploaded_by, rec.created_at, rec.updated_at
      );
    EXCEPTION WHEN unique_violation THEN
      -- ignore duplicates
    END;
  END LOOP;

  -- Mark latest version per template as current
  UPDATE company_file_versions v
  SET is_current = true
  FROM (
    SELECT template_id, max(created_at) AS max_created
    FROM company_file_versions
    GROUP BY template_id
  ) latest
  WHERE v.template_id = latest.template_id AND v.created_at = latest.max_created;
END $$;


