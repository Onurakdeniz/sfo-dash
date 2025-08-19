-- Company Modules table for per-company module enablement
CREATE TABLE IF NOT EXISTS "company_modules" (
    "id" text PRIMARY KEY NOT NULL,
    "company_id" text NOT NULL,
    "module_id" text NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "settings" jsonb,
    "toggled_by" text,
    "toggled_at" timestamp DEFAULT now(),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "company_modules_company_idx" ON "company_modules" ("company_id");
CREATE INDEX IF NOT EXISTS "company_modules_module_idx" ON "company_modules" ("module_id");
CREATE INDEX IF NOT EXISTS "company_modules_enabled_idx" ON "company_modules" ("is_enabled");
ALTER TABLE "company_modules" ADD CONSTRAINT "company_modules_unique" UNIQUE ("company_id","module_id");

ALTER TABLE "company_modules" ADD CONSTRAINT "company_modules_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_modules" ADD CONSTRAINT "company_modules_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;

-- Add company_id to role_module_permissions and adjust unique constraint
ALTER TABLE "role_module_permissions" ADD COLUMN IF NOT EXISTS "company_id" text;
CREATE INDEX IF NOT EXISTS "role_module_permissions_company_idx" ON "role_module_permissions" ("company_id");
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;

-- Drop old unique constraint if exists and add new one with company_id
DO $$ BEGIN
  ALTER TABLE "role_module_permissions" DROP CONSTRAINT IF EXISTS "role_module_permissions_unique";
EXCEPTION WHEN undefined_object THEN
  -- ignore
END $$;
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_unique" UNIQUE ("role_id","permission_id","workspace_id","company_id");


