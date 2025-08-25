import { z } from "zod";

// Customer status values
export const CUSTOMER_STATUS = [
  "active",
  "inactive",
  "prospect",
  "lead",
  "suspended",
  "closed"
] as const;

// Customer type values
export const CUSTOMER_TYPE = [
  "individual", // Bireysel müşteri
  "corporate" // Kurumsal müşteri
] as const;

// Customer category values
export const CUSTOMER_CATEGORY = [
  "vip", // VIP müşteri
  "premium", // Premium müşteri
  "standard", // Standart müşteri
  "basic", // Temel müşteri
  "wholesale", // Toptan müşteri
  "retail" // Perakende müşteri
] as const;

// Zod schemas
export const customerStatusSchema = z.enum(CUSTOMER_STATUS);
export const customerTypeSchema = z.enum(CUSTOMER_TYPE);
export const customerCategorySchema = z.enum(CUSTOMER_CATEGORY);

// Type exports
export type CustomerStatus = z.infer<typeof customerStatusSchema>;
export type CustomerType = z.infer<typeof customerTypeSchema>;
export type CustomerCategory = z.infer<typeof customerCategorySchema>;
