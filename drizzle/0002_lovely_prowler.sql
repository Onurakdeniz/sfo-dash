ALTER TYPE "public"."talep_category" ADD VALUE 'weapon_systems' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'ammunition' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'avionics' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'radar_systems' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'communication' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'electronic_warfare' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'naval_systems' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'land_systems' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'air_systems' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'cyber_security' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'simulation' BEFORE 'hardware';--> statement-breakpoint
ALTER TYPE "public"."talep_category" ADD VALUE 'c4isr' BEFORE 'hardware';--> statement-breakpoint
CREATE TABLE "talep_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"talep_id" text NOT NULL,
	"action_type" varchar(100) NOT NULL,
	"action_category" varchar(50),
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"communication_type" varchar(50),
	"contact_person" varchar(255),
	"contact_company" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(20),
	"outcome" varchar(100),
	"follow_up_required" boolean DEFAULT false,
	"follow_up_date" timestamp,
	"follow_up_notes" text,
	"related_product_ids" jsonb DEFAULT '[]'::jsonb,
	"attachment_ids" jsonb DEFAULT '[]'::jsonb,
	"duration" integer,
	"action_date" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"performed_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talep_products" (
	"id" text PRIMARY KEY NOT NULL,
	"talep_id" text NOT NULL,
	"product_code" varchar(100),
	"product_name" varchar(255) NOT NULL,
	"product_description" text,
	"manufacturer" varchar(255),
	"model" varchar(255),
	"part_number" varchar(100),
	"specifications" jsonb,
	"category" varchar(100),
	"sub_category" varchar(100),
	"requested_quantity" integer DEFAULT 1 NOT NULL,
	"unit_of_measure" varchar(50) DEFAULT 'piece',
	"target_price" numeric(15, 2),
	"currency" varchar(3) DEFAULT 'USD',
	"export_controlled" boolean DEFAULT false,
	"itar" boolean DEFAULT false,
	"end_use_statement" text,
	"certification_required" jsonb,
	"status" varchar(50) DEFAULT 'requested',
	"notes" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "talep" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "talep" ALTER COLUMN "type" SET DEFAULT 'general_inquiry'::text;--> statement-breakpoint
DROP TYPE "public"."talep_type";--> statement-breakpoint
CREATE TYPE "public"."talep_type" AS ENUM('rfq', 'rfi', 'rfp', 'product_inquiry', 'price_request', 'quotation_request', 'order_request', 'sample_request', 'certification_req', 'compliance_inquiry', 'export_license', 'end_user_cert', 'delivery_status', 'return_request', 'billing', 'technical_support', 'general_inquiry', 'complaint', 'feature_request', 'bug_report', 'installation', 'training', 'maintenance', 'other');--> statement-breakpoint
ALTER TABLE "talep" ALTER COLUMN "type" SET DEFAULT 'general_inquiry'::"public"."talep_type";--> statement-breakpoint
ALTER TABLE "talep" ALTER COLUMN "type" SET DATA TYPE "public"."talep_type" USING "type"::"public"."talep_type";--> statement-breakpoint
ALTER TABLE "talep" ADD COLUMN "code" varchar(20);--> statement-breakpoint
ALTER TABLE "talep" ADD COLUMN "customer_contact_id" text;--> statement-breakpoint
ALTER TABLE "talep_actions" ADD CONSTRAINT "talep_actions_talep_id_talep_id_fk" FOREIGN KEY ("talep_id") REFERENCES "public"."talep"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_actions" ADD CONSTRAINT "talep_actions_performed_by_user_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_products" ADD CONSTRAINT "talep_products_talep_id_talep_id_fk" FOREIGN KEY ("talep_id") REFERENCES "public"."talep"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_products" ADD CONSTRAINT "talep_products_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talep_products" ADD CONSTRAINT "talep_products_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "talep_actions_talep_idx" ON "talep_actions" USING btree ("talep_id");--> statement-breakpoint
CREATE INDEX "talep_actions_type_idx" ON "talep_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "talep_actions_category_idx" ON "talep_actions" USING btree ("action_category");--> statement-breakpoint
CREATE INDEX "talep_actions_outcome_idx" ON "talep_actions" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "talep_actions_performed_by_idx" ON "talep_actions" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX "talep_actions_date_idx" ON "talep_actions" USING btree ("action_date");--> statement-breakpoint
CREATE INDEX "talep_actions_follow_up_idx" ON "talep_actions" USING btree ("follow_up_required","follow_up_date");--> statement-breakpoint
CREATE INDEX "talep_products_talep_idx" ON "talep_products" USING btree ("talep_id");--> statement-breakpoint
CREATE INDEX "talep_products_code_idx" ON "talep_products" USING btree ("product_code");--> statement-breakpoint
CREATE INDEX "talep_products_name_idx" ON "talep_products" USING btree ("product_name");--> statement-breakpoint
CREATE INDEX "talep_products_category_idx" ON "talep_products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "talep_products_status_idx" ON "talep_products" USING btree ("status");--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_customer_contact_id_customer_contacts_id_fk" FOREIGN KEY ("customer_contact_id") REFERENCES "public"."customer_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "talep_customer_contact_idx" ON "talep" USING btree ("customer_contact_id");--> statement-breakpoint
ALTER TABLE "talep" ADD CONSTRAINT "talep_code_unique" UNIQUE("code");