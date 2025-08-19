-- Employee files (non-versioned) stored in Vercel Blob
CREATE TABLE IF NOT EXISTS "employee_files" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
  "company_id" text NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,

  "name" varchar(255) NOT NULL,
  "category" varchar(100),
  "description" text,

  "blob_url" text NOT NULL,
  "blob_path" text,
  "content_type" varchar(255),
  "size" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb,

  "created_by" text REFERENCES "user"("id"),
  "updated_by" text REFERENCES "user"("id"),

  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

CREATE INDEX IF NOT EXISTS "employee_files_workspace_idx" ON "employee_files" ("workspace_id");
CREATE INDEX IF NOT EXISTS "employee_files_company_idx" ON "employee_files" ("company_id");
CREATE INDEX IF NOT EXISTS "employee_files_user_idx" ON "employee_files" ("user_id");
CREATE INDEX IF NOT EXISTS "employee_files_category_idx" ON "employee_files" ("category");
CREATE INDEX IF NOT EXISTS "employee_files_created_idx" ON "employee_files" ("created_at");


