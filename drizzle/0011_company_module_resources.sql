CREATE TABLE IF NOT EXISTS "company_module_resources" (
    "id" text PRIMARY KEY NOT NULL,
    "company_id" text NOT NULL,
    "resource_id" text NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "toggled_by" text,
    "toggled_at" timestamp DEFAULT now(),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "company_module_resources_company_idx" ON "company_module_resources" ("company_id");
CREATE INDEX IF NOT EXISTS "company_module_resources_resource_idx" ON "company_module_resources" ("resource_id");
CREATE INDEX IF NOT EXISTS "company_module_resources_enabled_idx" ON "company_module_resources" ("is_enabled");
ALTER TABLE "company_module_resources" ADD CONSTRAINT "company_module_resources_unique" UNIQUE ("company_id","resource_id");

ALTER TABLE "company_module_resources" ADD CONSTRAINT "company_module_resources_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_module_resources" ADD CONSTRAINT "company_module_resources_resource_id_module_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."module_resources"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "company_module_resources" ADD CONSTRAINT "company_module_resources_toggled_by_users_id_fk" FOREIGN KEY ("toggled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

