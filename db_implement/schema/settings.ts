/**
 * Settings Schema
 * 
 * This module defines application settings and feature flags.
 * It includes workspace/company settings and feature management.
 * 
 * Tables:
 * - workspaceSettings: Workspace-specific configuration and preferences
 * - companySettings: Company-specific settings and customizations
 * - featureFlags: Feature toggle management for gradual rollouts
 * 
 * Constants:
 * - FEATURE_CATEGORIES: Feature categorization for organization
 * - INVOICE_NUMBERING_TYPES: Invoice numbering system options
 */

import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb, serial, index, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { workspaces } from "./workspace";
import { companies, departments, units } from "./company";

// Define string constants for better type safety and easier maintenance
// Using const assertions and check constraints instead of PostgreSQL enums
export const FEATURE_CATEGORIES = [
  "hr", "finance", "inventory", "crm", "project", "document", "reporting", "integration", "security", "general"
] as const;
export const INVOICE_NUMBERING_TYPES = ["sequential", "yearly", "monthly"] as const;

// ---------------------------------------------------------------------------
// PERMISSION CONSTANTS
// ---------------------------------------------------------------------------
// These arrays provide the allowed actions and scopes for permissions throughout
// the application. Having them here (instead of hard-coding them in multiple
// places) ensures a single source of truth that can also be referenced by
// runtime validation utilities.
export const PERMISSION_ACTIONS = [
  "view",  // Read-only access
  "edit",  // Update existing entities (create & delete are covered by module-level actions)
  "all"     // Super-set / unrestricted action used mainly by system roles
] as const;

export const PERMISSION_SCOPES = [
  "workspace",
  "company",
] as const;


// TypeScript types derived from the constants
export type FeatureCategory = typeof FEATURE_CATEGORIES[number];
export type InvoiceNumberingType = typeof INVOICE_NUMBERING_TYPES[number];
 
export type PermissionScope = typeof PERMISSION_SCOPES[number];

// Workspace Settings - Global settings for the entire workspace
export const workspaceSettings = pgTable("workspace_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull().unique(),
  
  // General Settings
  timezone: varchar("timezone", { length: 100 }).default("Europe/Istanbul"),
  currency: varchar("currency", { length: 10 }).default("TRY"),
  language: varchar("language", { length: 10 }).default("tr"),
  dateFormat: varchar("date_format", { length: 20 }).default("DD/MM/YYYY"),
  
  // Working Hours
  workingHoursStart: varchar("working_hours_start", { length: 10 }).default("09:00"),
  workingHoursEnd: varchar("working_hours_end", { length: 10 }).default("18:00"),
  workingDays: jsonb("working_days").$type<string[]>().default(["monday", "tuesday", "wednesday", "thursday", "friday"]),
  
  // Public Holidays (Official Holidays)
  publicHolidays: jsonb("public_holidays").$type<{ date: string; name?: string }[]>().default([]),
  
  // Custom Settings
  customSettings: jsonb("custom_settings").$type<Record<string, any>>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete field
});

// Company Settings - Specific settings for each company
export const companySettings = pgTable("company_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Business Settings
  fiscalYearStart: varchar("fiscal_year_start", { length: 10 }).default("01/01").notNull(), // MM/DD format
  taxRate: varchar("tax_rate", { length: 10 }).default("18").notNull(), // Default Turkish VAT
  invoicePrefix: varchar("invoice_prefix", { length: 10 }).default("INV").notNull(),
  invoiceNumbering: varchar("invoice_numbering", { length: 20 }).default("sequential").notNull(),

  // Working Hours (Company-specific overrides; falls back to workspace if null)
  workingHoursStart: varchar("working_hours_start", { length: 10 }),
  workingHoursEnd: varchar("working_hours_end", { length: 10 }),
  workingDays: jsonb("working_days").$type<string[]>(),
  
  // Public Holidays (Company-specific)
  publicHolidays: jsonb("public_holidays").$type<{ date: string; name?: string }[]>(),
  
  // Custom Company Settings
  customSettings: jsonb("custom_settings").$type<Record<string, any>>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete field
}, (table) => [
  // Add index for company lookup
  index("company_settings_company_idx").on(table.companyId),
  // Check constraint for invoice numbering
  check("company_settings_invoice_numbering_check", sql`invoice_numbering IN ('sequential', 'yearly', 'monthly')`),
]);

// Feature Flags - Enable/disable specific features per workspace or company
export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  isEnabled: boolean("is_enabled").default(false).notNull(),
  rolloutPercentage: integer("rollout_percentage").default(0).notNull(),
  category: varchar("category", { length: 20 }).default("general").notNull(),
  enabledAt: timestamp("enabled_at"),
  disabledAt: timestamp("disabled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // Soft delete field
}, (table) => [
  // Add indexes for better performance
  index("feature_flags_name_idx").on(table.name),
  index("feature_flags_workspace_idx").on(table.workspaceId),
  index("feature_flags_company_idx").on(table.companyId),
  index("feature_flags_category_idx").on(table.category),
  // Unique constraint for feature name per workspace/company
  unique("feature_flags_workspace_name_unique").on(table.workspaceId, table.name),
  unique("feature_flags_company_name_unique").on(table.companyId, table.name),
  // Check constraint for category
  check("feature_flags_category_check", sql`category IN ('hr', 'finance', 'inventory', 'crm', 'project', 'document', 'reporting', 'integration', 'security', 'general')`),
]);


