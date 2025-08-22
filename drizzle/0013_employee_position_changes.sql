-- Employee position changes audit log
CREATE TABLE IF NOT EXISTS "employee_position_changes" (
  "id" text PRIMARY KEY,
  "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE cascade,
  "company_id" text NOT NULL REFERENCES "companies"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,

  "previous_position" varchar(255),
  "new_position" varchar(255),

  "previous_department_id" text REFERENCES "departments"("id"),
  "new_department_id" text REFERENCES "departments"("id"),

  "previous_unit_id" text REFERENCES "units"("id"),
  "new_unit_id" text REFERENCES "units"("id"),

  "reason" text,
  "effective_date" timestamp DEFAULT now() NOT NULL,
  "created_by" text REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "employee_pos_changes_workspace_idx" ON "employee_position_changes" ("workspace_id");
CREATE INDEX IF NOT EXISTS "employee_pos_changes_company_idx" ON "employee_position_changes" ("company_id");
CREATE INDEX IF NOT EXISTS "employee_pos_changes_user_idx" ON "employee_position_changes" ("user_id");
CREATE INDEX IF NOT EXISTS "employee_pos_changes_effective_idx" ON "employee_position_changes" ("effective_date");


