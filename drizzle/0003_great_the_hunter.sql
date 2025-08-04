CREATE TYPE "public"."company_type" AS ENUM('anonim_sirket', 'limited_sirket', 'kolektif_sirket', 'komandit_sirket', 'sermayesi_paylara_bolunmus_komandit_sirket', 'kooperatif', 'dernek', 'vakif', 'sahis_isletmesi', 'diger');--> statement-breakpoint
ALTER TABLE "departments" DROP CONSTRAINT "departments_parent_department_id_departments_id_fk";
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "company_type" "company_type";