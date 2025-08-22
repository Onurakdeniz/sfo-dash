import { pgTable, varchar, text, timestamp, integer, index, unique, jsonb, check, boolean, decimal, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { orderStatusEnum, orderTypeEnum, orderPriorityEnum, paymentStatusEnum, deliveryStatusEnum, orderSourceEnum } from "../enums";
import { user } from "./user";
import { workspace } from "./workspace";
import { company } from "./company";
import { businessEntity } from "./businessEntity";
import { talep } from "./talep";

// Orders table - manages orders with both supplier and customer relationships for middleman operations
export const order = pgTable('orders', {
  /* Core identifier */
  id: text('id').primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),

  /* Workspace and company association */
  workspaceId: text('workspace_id').references(() => workspace.id, { onDelete: 'cascade' }).notNull(),
  companyId: text('company_id').references(() => company.id, { onDelete: 'cascade' }).notNull(),

  /* Order details */
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  orderType: orderTypeEnum('order_type').default('standard').notNull(),
  status: orderStatusEnum('status').default('draft').notNull(),
  priority: orderPriorityEnum('priority').default('medium').notNull(),
  orderSource: orderSourceEnum('order_source').default('direct').notNull(),

  /* Middleman relationships */
  // Customer who is buying from us
  customerId: text('customer_id').references(() => businessEntity.id).notNull(),
  customerPONumber: varchar('customer_po_number', { length: 100 }), // Customer's purchase order number

  // Supplier we are buying from
  supplierId: text('supplier_id').references(() => businessEntity.id),
  supplierSONumber: varchar('supplier_so_number', { length: 100 }), // Supplier's sales order number

  /* Related talep (customer request) */
  talepId: text('talep_id').references(() => talep.id),

  /* Order dates */
  orderDate: timestamp('order_date').defaultNow().notNull(),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  actualDeliveryDate: timestamp('actual_delivery_date'),
  deadlineDate: timestamp('deadline_date'),

  /* Financial information - Customer side */
  customerCurrency: varchar('customer_currency', { length: 3 }).default('USD').notNull(),
  customerSubtotal: decimal('customer_subtotal', { precision: 15, scale: 2 }).notNull(),
  customerTaxAmount: decimal('customer_tax_amount', { precision: 15, scale: 2 }).default(0),
  customerDiscountAmount: decimal('customer_discount_amount', { precision: 15, scale: 2 }).default(0),
  customerShippingAmount: decimal('customer_shipping_amount', { precision: 15, scale: 2 }).default(0),
  customerTotalAmount: decimal('customer_total_amount', { precision: 15, scale: 2 }).notNull(),

  /* Financial information - Supplier side */
  supplierCurrency: varchar('supplier_currency', { length: 3 }).default('USD'),
  supplierSubtotal: decimal('supplier_subtotal', { precision: 15, scale: 2 }),
  supplierTaxAmount: decimal('supplier_tax_amount', { precision: 15, scale: 2 }),
  supplierDiscountAmount: decimal('supplier_discount_amount', { precision: 15, scale: 2 }),
  supplierShippingAmount: decimal('supplier_shipping_amount', { precision: 15, scale: 2 }),
  supplierTotalAmount: decimal('supplier_total_amount', { precision: 15, scale: 2 }),

  /* Profit calculation */
  profitMargin: decimal('profit_margin', { precision: 5, scale: 2 }), // Percentage
  profitAmount: decimal('profit_amount', { precision: 15, scale: 2 }), // Calculated profit

  /* Payment information */
  customerPaymentStatus: paymentStatusEnum('customer_payment_status').default('pending').notNull(),
  customerPaymentTerms: varchar('customer_payment_terms', { length: 100 }),
  customerPaymentDueDate: timestamp('customer_payment_due_date'),
  
  supplierPaymentStatus: paymentStatusEnum('supplier_payment_status').default('pending'),
  supplierPaymentTerms: varchar('supplier_payment_terms', { length: 100 }),
  supplierPaymentDueDate: timestamp('supplier_payment_due_date'),

  /* Delivery information */
  deliveryStatus: deliveryStatusEnum('delivery_status').default('pending').notNull(),
  shippingMethod: varchar('shipping_method', { length: 100 }),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  
  /* Addresses */
  billingAddressId: text('billing_address_id'), // References businessEntityAddress
  shippingAddressId: text('shipping_address_id'), // References businessEntityAddress

  /* Defense industry specific */
  exportControlled: boolean('export_controlled').default(false),
  exportLicenseNumber: varchar('export_license_number', { length: 100 }),
  endUserCertificate: boolean('end_user_certificate').default(false),
  endUserCertificateNumber: varchar('end_user_certificate_number', { length: 100 }),

  /* Tags and metadata */
  tags: jsonb('tags').default([]),
  metadata: jsonb('metadata'),

  /* Notes */
  publicNotes: text('public_notes'), // Visible to customer
  internalNotes: text('internal_notes'), // Internal only

  /* Audit fields */
  createdBy: text('created_by').references(() => user.id),
  updatedBy: text('updated_by').references(() => user.id),
  approvedBy: text('approved_by').references(() => user.id),
  approvedAt: timestamp('approved_at'),

  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  cancelledAt: timestamp('cancelled_at'),
  completedAt: timestamp('completed_at'),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  // Performance indexes
  index('orders_workspace_company_idx').on(table.workspaceId, table.companyId),
  index('orders_order_number_idx').on(table.orderNumber),
  index('orders_status_idx').on(table.status),
  index('orders_type_idx').on(table.orderType),
  index('orders_priority_idx').on(table.priority),
  index('orders_customer_idx').on(table.customerId),
  index('orders_supplier_idx').on(table.supplierId),
  index('orders_talep_idx').on(table.talepId),
  index('orders_order_date_idx').on(table.orderDate),
  index('orders_expected_delivery_idx').on(table.expectedDeliveryDate),
  index('orders_customer_payment_status_idx').on(table.customerPaymentStatus),
  index('orders_supplier_payment_status_idx').on(table.supplierPaymentStatus),
  index('orders_delivery_status_idx').on(table.deliveryStatus),
  index('orders_created_by_idx').on(table.createdBy),
  index('orders_created_at_idx').on(table.createdAt),

  // Composite indexes
  index('orders_customer_status_idx').on(table.customerId, table.status),
  index('orders_supplier_status_idx').on(table.supplierId, table.status),
  index('orders_status_date_idx').on(table.status, table.orderDate),

  // Unique constraints
  unique('orders_order_number_unique').on(table.workspaceId, table.companyId, table.orderNumber),

  // Validation constraints
  check('orders_customer_total_check', sql`customer_total_amount >= 0`),
  check('orders_supplier_total_check', sql`supplier_total_amount IS NULL OR supplier_total_amount >= 0`),
  check('orders_profit_margin_check', sql`profit_margin IS NULL OR (profit_margin >= -100 AND profit_margin <= 1000)`),
]);

// Order items table - line items for orders
export const orderItem = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => order.id, { onDelete: 'cascade' }).notNull(),

  /* Product information */
  productCode: varchar('product_code', { length: 100 }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productDescription: text('product_description'),
  manufacturer: varchar('manufacturer', { length: 255 }),
  partNumber: varchar('part_number', { length: 100 }),

  /* Quantities and units */
  quantity: decimal('quantity', { precision: 15, scale: 3 }).notNull(),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }).default('piece').notNull(),

  /* Customer pricing */
  customerUnitPrice: decimal('customer_unit_price', { precision: 15, scale: 2 }).notNull(),
  customerDiscountPercent: decimal('customer_discount_percent', { precision: 5, scale: 2 }).default(0),
  customerDiscountAmount: decimal('customer_discount_amount', { precision: 15, scale: 2 }).default(0),
  customerTaxRate: decimal('customer_tax_rate', { precision: 5, scale: 2 }).default(0),
  customerTaxAmount: decimal('customer_tax_amount', { precision: 15, scale: 2 }).default(0),
  customerLineTotal: decimal('customer_line_total', { precision: 15, scale: 2 }).notNull(),

  /* Supplier pricing (if sourced from supplier) */
  supplierUnitPrice: decimal('supplier_unit_price', { precision: 15, scale: 2 }),
  supplierDiscountPercent: decimal('supplier_discount_percent', { precision: 5, scale: 2 }),
  supplierDiscountAmount: decimal('supplier_discount_amount', { precision: 15, scale: 2 }),
  supplierTaxRate: decimal('supplier_tax_rate', { precision: 5, scale: 2 }),
  supplierTaxAmount: decimal('supplier_tax_amount', { precision: 15, scale: 2 }),
  supplierLineTotal: decimal('supplier_line_total', { precision: 15, scale: 2 }),

  /* Item profit */
  itemProfitMargin: decimal('item_profit_margin', { precision: 5, scale: 2 }),
  itemProfitAmount: decimal('item_profit_amount', { precision: 15, scale: 2 }),

  /* Defense specifications */
  specifications: jsonb('specifications'), // Technical specifications
  certificationRequired: jsonb('certification_required'), // Array of required certifications
  exportControlled: boolean('export_controlled').default(false),

  /* Status and fulfillment */
  status: varchar('status', { length: 50 }).default('pending'), // pending, confirmed, shipped, delivered, cancelled
  deliveredQuantity: decimal('delivered_quantity', { precision: 15, scale: 3 }).default(0),

  /* Notes */
  notes: text('notes'),
  metadata: jsonb('metadata'),

  /* Display order */
  sortOrder: integer('sort_order').default(0),

  /* Timestamps */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('order_items_order_idx').on(table.orderId),
  index('order_items_product_code_idx').on(table.productCode),
  index('order_items_status_idx').on(table.status),
  index('order_items_sort_order_idx').on(table.sortOrder),

  // Validation constraints
  check('order_items_quantity_check', sql`quantity > 0`),
  check('order_items_customer_price_check', sql`customer_unit_price >= 0`),
  check('order_items_supplier_price_check', sql`supplier_unit_price IS NULL OR supplier_unit_price >= 0`),
]);

// Order status history table - tracks order status changes
export const orderStatusHistory = pgTable('order_status_history', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => order.id, { onDelete: 'cascade' }).notNull(),

  /* Status change details */
  fromStatus: orderStatusEnum('from_status'),
  toStatus: orderStatusEnum('to_status').notNull(),
  reason: text('reason'),
  notes: text('notes'),

  /* Related information */
  relatedDocumentUrl: text('related_document_url'),
  metadata: jsonb('metadata'),

  /* Audit fields */
  changedBy: text('changed_by').references(() => user.id).notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
}, (table) => [
  index('order_status_history_order_idx').on(table.orderId),
  index('order_status_history_to_status_idx').on(table.toStatus),
  index('order_status_history_changed_at_idx').on(table.changedAt),
  index('order_status_history_changed_by_idx').on(table.changedBy),
]);

// Order documents table - files associated with orders
export const orderDocument = pgTable('order_documents', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => order.id, { onDelete: 'cascade' }).notNull(),

  /* Document details */
  documentType: varchar('document_type', { length: 100 }).notNull(), // invoice, po, packing_list, certificate, etc.
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  blobUrl: text('blob_url').notNull(),
  blobPath: text('blob_path'),
  contentType: varchar('content_type', { length: 255 }),
  size: integer('size').default(0).notNull(),

  /* Document metadata */
  documentNumber: varchar('document_number', { length: 100 }),
  documentDate: date('document_date'),
  isCustomerVisible: boolean('is_customer_visible').default(false).notNull(),
  isSupplierDocument: boolean('is_supplier_document').default(false).notNull(),

  /* Additional metadata */
  metadata: jsonb('metadata'),

  /* Audit fields */
  uploadedBy: text('uploaded_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('order_documents_order_idx').on(table.orderId),
  index('order_documents_type_idx').on(table.documentType),
  index('order_documents_customer_visible_idx').on(table.isCustomerVisible),
  index('order_documents_created_at_idx').on(table.createdAt),
]);

// Order payments table - tracks payments for orders
export const orderPayment = pgTable('order_payments', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => order.id, { onDelete: 'cascade' }).notNull(),

  /* Payment type */
  paymentType: varchar('payment_type', { length: 50 }).notNull(), // customer_payment, supplier_payment
  
  /* Payment details */
  paymentMethod: varchar('payment_method', { length: 50 }), // bank_transfer, credit_card, cash, etc.
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  
  /* Transaction details */
  transactionId: varchar('transaction_id', { length: 255 }),
  transactionDate: timestamp('transaction_date').notNull(),
  referenceNumber: varchar('reference_number', { length: 100 }),
  
  /* Bank details (for transfers) */
  bankName: varchar('bank_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 100 }),
  
  /* Status */
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, processing, completed, failed, refunded
  
  /* Notes and metadata */
  notes: text('notes'),
  metadata: jsonb('metadata'),
  
  /* Audit fields */
  processedBy: text('processed_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('order_payments_order_idx').on(table.orderId),
  index('order_payments_type_idx').on(table.paymentType),
  index('order_payments_status_idx').on(table.status),
  index('order_payments_transaction_date_idx').on(table.transactionDate),
  
  // Validation constraints
  check('order_payments_amount_check', sql`amount > 0`),
]);

// Type exports
export type OrderType = typeof order.$inferSelect;
export type OrderItemType = typeof orderItem.$inferSelect;
export type OrderStatusHistoryType = typeof orderStatusHistory.$inferSelect;
export type OrderDocumentType = typeof orderDocument.$inferSelect;
export type OrderPaymentType = typeof orderPayment.$inferSelect;