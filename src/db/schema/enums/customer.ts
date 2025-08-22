import { pgEnum } from "drizzle-orm/pg-core";

export const customerStatusEnum = pgEnum("customer_status", [
  "active",
  "inactive",
  "prospect",
  "lead",
  "suspended",
  "closed"
]);

export const customerTypeEnum = pgEnum("customer_type", [
  "individual", // Bireysel müşteri
  "corporate" // Kurumsal müşteri
]);

export const customerCategoryEnum = pgEnum("customer_category", [
  "vip", // VIP müşteri
  "premium", // Premium müşteri
  "standard", // Standart müşteri
  "basic", // Temel müşteri
  "wholesale", // Toptan müşteri
  "retail" // Perakende müşteri
]);
