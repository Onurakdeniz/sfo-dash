import { pgEnum } from "drizzle-orm/pg-core";

export const supplierStatusEnum = pgEnum("supplier_status", [
  "active",
  "inactive",
  "prospect",
  "suspended",
  "blacklisted",
  "closed"
]);

export const supplierTypeEnum = pgEnum("supplier_type", [
  "individual", // Bireysel tedarikçi
  "corporate" // Kurumsal tedarikçi
]);

export const supplierCategoryEnum = pgEnum("supplier_category", [
  "strategic", // Stratejik tedarikçi
  "preferred", // Tercih edilen tedarikçi
  "approved", // Onaylı tedarikçi
  "standard", // Standart tedarikçi
  "new", // Yeni tedarikçi
  "temporary" // Geçici tedarikçi
]);
