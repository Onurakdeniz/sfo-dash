import { pgEnum } from "drizzle-orm/pg-core";

// Order status enum
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
  "refunded",
  "on_hold"
]);

// Order type enum
export const orderTypeEnum = pgEnum("order_type", [
  "standard",
  "urgent",
  "sample",
  "replacement",
  "warranty",
  "government",
  "export"
]);

// Order priority enum
export const orderPriorityEnum = pgEnum("order_priority", [
  "low",
  "medium",
  "high",
  "urgent",
  "critical"
]);

// Payment status enum
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "partial",
  "paid",
  "overdue",
  "refunded",
  "cancelled"
]);

// Delivery status enum
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "pending",
  "preparing",
  "ready",
  "shipped",
  "in_transit",
  "delivered",
  "failed",
  "returned"
]);

// Order source enum
export const orderSourceEnum = pgEnum("order_source", [
  "direct",
  "website",
  "email",
  "phone",
  "talep",
  "exhibition",
  "referral"
]);