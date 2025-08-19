-- Create employee_profiles table
CREATE TABLE IF NOT EXISTS "employee_profiles" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "company_id" text NOT NULL REFERENCES "companies"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "national_id" varchar(20),
  "birth_date" timestamp,
  "gender" varchar(20),
  "address" text,
  "phone" varchar(20),
  "emergency_contact_name" varchar(255),
  "emergency_contact_phone" varchar(20),
  "position" varchar(255),
  "department_id" text REFERENCES "departments"("id"),
  "manager_id" text REFERENCES "users"("id"),
  "employment_type" varchar(50),
  "start_date" timestamp,
  "end_date" timestamp,
  "notes" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Unique key to prevent duplicates per workspace+company+user
CREATE UNIQUE INDEX IF NOT EXISTS "employee_profiles_unique"
  ON "employee_profiles" ("workspace_id", "company_id", "user_id");

-- Helpful indexes
CREATE INDEX IF NOT EXISTS "employee_profiles_workspace_idx" ON "employee_profiles" ("workspace_id");
CREATE INDEX IF NOT EXISTS "employee_profiles_company_idx" ON "employee_profiles" ("company_id");
CREATE INDEX IF NOT EXISTS "employee_profiles_user_idx" ON "employee_profiles" ("user_id");
CREATE INDEX IF NOT EXISTS "employee_profiles_department_idx" ON "employee_profiles" ("department_id");

