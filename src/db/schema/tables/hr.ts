import { pgTable, text, varchar, timestamp, jsonb, index, unique, integer } from "drizzle-orm/pg-core";
import { workspace } from "./workspace";
import { company, department } from "./company";
import { user } from "./user";

// Employee Profile table - stores extended HR profile information per user within a workspace & company
export const employeeProfile = pgTable("employee_profiles", {
  id: text("id").primaryKey(),

  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }).notNull(),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),

  // Personal information
  nationalId: varchar("national_id", { length: 20 }),
  birthDate: timestamp("birth_date"),
  gender: varchar("gender", { length: 20 }),

  // Contact information
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),

  // Employment information
  position: varchar("position", { length: 255 }),
  departmentId: text("department_id").references(() => department.id),
  managerId: text("manager_id").references(() => user.id),
  employmentType: varchar("employment_type", { length: 50 }), // full_time, part_time, contractor, intern, etc.
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),

  // Misc
  notes: text("notes"),
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique("employee_profiles_unique").on(table.workspaceId, table.companyId, table.userId),
  index("employee_profiles_workspace_idx").on(table.workspaceId),
  index("employee_profiles_company_idx").on(table.companyId),
  index("employee_profiles_user_idx").on(table.userId),
  index("employee_profiles_department_idx").on(table.departmentId),
]);

export type EmployeeProfile = typeof employeeProfile.$inferSelect;

// Employee files - simple, non-versioned documents uploaded per employee
export const employeeFile = pgTable("employee_files", {
  id: text("id").primaryKey(),

  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "cascade" }).notNull(),
  companyId: text("company_id").references(() => company.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),

  blobUrl: text("blob_url").notNull(),
  blobPath: text("blob_path"),
  contentType: varchar("content_type", { length: 255 }),
  size: integer("size").default(0).notNull(),
  metadata: jsonb("metadata"),

  createdBy: text("created_by").references(() => user.id),
  updatedBy: text("updated_by").references(() => user.id),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => [
  index("employee_files_workspace_idx").on(table.workspaceId),
  index("employee_files_company_idx").on(table.companyId),
  index("employee_files_user_idx").on(table.userId),
  index("employee_files_category_idx").on(table.category),
  index("employee_files_created_idx").on(table.createdAt),
]);

export type EmployeeFile = typeof employeeFile.$inferSelect;


