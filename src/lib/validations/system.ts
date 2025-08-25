import { z } from 'zod';

// ============================================
// BUSINESS ENTITY SCHEMAS
// ============================================

export const BusinessEntityTypeSchema = z.enum([
  'supplier',
  'customer',
  'both' // Entity can act as both supplier and customer
]);

export type BusinessEntityType = z.infer<typeof BusinessEntityTypeSchema>;

export const BusinessEntityStatusSchema = z.enum([
  'active',
  'inactive',
  'pending',
  'suspended',
  'blocked'
]);

export type BusinessEntityStatus = z.infer<typeof BusinessEntityStatusSchema>;

export const BusinessEntityCategorySchema = z.enum([
  'manufacturer',
  'distributor',
  'reseller',
  'service_provider',
  'government',
  'defense_contractor',
  'sub_contractor',
  'consultant',
  'logistics',
  'other'
]);

export type BusinessEntityCategory = z.infer<typeof BusinessEntityCategorySchema>;

// ============================================
// WORKSPACE SCHEMAS
// ============================================

export const WorkspaceMemberRoleSchema = z.enum([
  'owner',
  'admin',
  'member',
  'viewer'
]);

export type WorkspaceMemberRole = z.infer<typeof WorkspaceMemberRoleSchema>;

// ============================================
// COMPANY SCHEMAS
// ============================================

export const CompanyStatusSchema = z.enum([
  'active',
  'inactive',
  'onboarding',
  'suspended',
  'lead'
]);

export type CompanyStatus = z.infer<typeof CompanyStatusSchema>;

export const CompanyTypeSchema = z.enum([
  'anonim_sirket', // A.Ş. - Anonim Şirket
  'limited_sirket', // Ltd. Şti. - Limited Şirket
  'kolektif_sirket', // Kolektif Şirket
  'komandit_sirket', // Komandit Şirket
  'sermayesi_paylara_bolunmus_komandit_sirket', // Sermayesi Paylara Bölünmüş Komandit Şirket
  'kooperatif', // Kooperatif
  'dernek', // Dernek
  'vakif', // Vakıf
  'sahis_isletmesi', // Şahıs İşletmesi
  'diger' // Diğer
]);

export type CompanyType = z.infer<typeof CompanyTypeSchema>;

// ============================================
// INVITATION SCHEMAS
// ============================================

export const InvitationStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'expired',
  'cancelled'
]);

export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const InvitationRoleSchema = z.enum([
  'admin',
  'member',
  'viewer'
]);

export type InvitationRole = z.infer<typeof InvitationRoleSchema>;

// ============================================
// PRODUCT SCHEMAS
// ============================================

export const ProductStatusSchema = z.enum([
  'active',
  'inactive',
  'draft',
  'discontinued',
  'out_of_stock'
]);

export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductTypeSchema = z.enum([
  'physical',
  'service',
  'digital',
  'subscription',
  'bundle'
]);

export type ProductType = z.infer<typeof ProductTypeSchema>;

export const ProductCategorySchema = z.enum([
  // Defense & Military
  'weapons',
  'ammunition',
  'vehicles',
  'aircraft',
  'naval',
  'electronics',
  'communications',
  'protective_gear',
  'surveillance',
  'training_equipment',
  
  // Industrial
  'machinery',
  'tools',
  'raw_materials',
  'components',
  'safety_equipment',
  
  // Services
  'maintenance',
  'training',
  'consulting',
  'logistics',
  
  // Other
  'other'
]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

// ============================================
// SUPPLIER SCHEMAS
// ============================================

export const SupplierStatusSchema = z.enum([
  'active',
  'inactive',
  'pending_approval',
  'approved',
  'rejected',
  'blacklisted'
]);

export type SupplierStatus = z.infer<typeof SupplierStatusSchema>;

export const SupplierTypeSchema = z.enum([
  'manufacturer',
  'distributor',
  'wholesaler',
  'retailer',
  'service_provider',
  'contractor',
  'consultant'
]);

export type SupplierType = z.infer<typeof SupplierTypeSchema>;

export const SupplierRatingSchema = z.enum([
  'excellent',
  'good',
  'average',
  'poor',
  'unrated'
]);

export type SupplierRating = z.infer<typeof SupplierRatingSchema>;

// ============================================
// CUSTOMER SCHEMAS
// ============================================

export const CustomerStatusSchema = z.enum([
  'active',
  'inactive',
  'prospect',
  'lead',
  'suspended',
  'blacklisted'
]);

export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;

export const CustomerTypeSchema = z.enum([
  'corporate',
  'government',
  'military',
  'individual',
  'reseller',
  'distributor'
]);

export type CustomerType = z.infer<typeof CustomerTypeSchema>;

export const CustomerSegmentSchema = z.enum([
  'vip',
  'premium',
  'standard',
  'basic',
  'trial'
]);

export type CustomerSegment = z.infer<typeof CustomerSegmentSchema>;

// ============================================
// ORDER SCHEMAS
// ============================================

export const OrderStatusSchema = z.enum([
  'draft',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'refunded',
  'on_hold'
]);

export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderTypeSchema = z.enum([
  'purchase_order',
  'sales_order',
  'transfer_order',
  'return_order',
  'service_order'
]);

export type OrderType = z.infer<typeof OrderTypeSchema>;

export const PaymentStatusSchema = z.enum([
  'pending',
  'processing',
  'paid',
  'partially_paid',
  'failed',
  'refunded',
  'cancelled'
]);

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PaymentMethodSchema = z.enum([
  'cash',
  'bank_transfer',
  'credit_card',
  'debit_card',
  'check',
  'letter_of_credit',
  'wire_transfer',
  'other'
]);

export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const ShippingMethodSchema = z.enum([
  'standard',
  'express',
  'overnight',
  'freight',
  'pickup',
  'digital_delivery'
]);

export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;

// ============================================
// HR/EMPLOYEE SCHEMAS
// ============================================

export const EmploymentTypeSchema = z.enum([
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'intern',
  'consultant',
  'freelance'
]);

export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;

export const EmployeeStatusSchema = z.enum([
  'active',
  'inactive',
  'on_leave',
  'terminated',
  'retired',
  'suspended'
]);

export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>;

export const DepartmentSchema = z.enum([
  'management',
  'sales',
  'marketing',
  'engineering',
  'production',
  'quality',
  'procurement',
  'finance',
  'hr',
  'it',
  'legal',
  'logistics',
  'customer_service',
  'r_and_d',
  'other'
]);

export type Department = z.infer<typeof DepartmentSchema>;

// ============================================
// GENERAL SCHEMAS
// ============================================

export const GenderSchema = z.enum([
  'male',
  'female',
  'other',
  'prefer_not_to_say'
]);

export type Gender = z.infer<typeof GenderSchema>;

export const MaritalStatusSchema = z.enum([
  'single',
  'married',
  'divorced',
  'widowed',
  'separated',
  'other'
]);

export type MaritalStatus = z.infer<typeof MaritalStatusSchema>;

export const BloodTypeSchema = z.enum([
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-'
]);

export type BloodType = z.infer<typeof BloodTypeSchema>;

export const EducationLevelSchema = z.enum([
  'primary',
  'secondary',
  'high_school',
  'associate',
  'bachelor',
  'master',
  'doctorate',
  'other'
]);

export type EducationLevel = z.infer<typeof EducationLevelSchema>;

// ============================================
// ADDRESS SCHEMAS
// ============================================

export const AddressTypeSchema = z.enum([
  'billing',
  'shipping',
  'headquarters',
  'branch',
  'warehouse',
  'factory',
  'office',
  'home',
  'other'
]);

export type AddressType = z.infer<typeof AddressTypeSchema>;

// ============================================
// CONTACT SCHEMAS
// ============================================

export const ContactTypeSchema = z.enum([
  'primary',
  'secondary',
  'emergency',
  'billing',
  'technical',
  'sales',
  'support'
]);

export type ContactType = z.infer<typeof ContactTypeSchema>;

export const PhoneTypeSchema = z.enum([
  'mobile',
  'office',
  'home',
  'fax',
  'other'
]);

export type PhoneType = z.infer<typeof PhoneTypeSchema>;

// ============================================
// PERMISSION & ROLE SCHEMAS
// ============================================

export const PermissionActionSchema = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'list',
  'export',
  'import',
  'approve',
  'reject',
  'assign',
  'manage'
]);

export type PermissionAction = z.infer<typeof PermissionActionSchema>;

export const ResourceTypeSchema = z.enum([
  'workspace',
  'company',
  'user',
  'role',
  'permission',
  'request',
  'order',
  'product',
  'supplier',
  'customer',
  'employee',
  'file',
  'report',
  'settings',
  'audit_log'
]);

export type ResourceType = z.infer<typeof ResourceTypeSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

// Helper to check if a value is valid for a given schema
export function isValidEnumValue<T extends z.ZodEnum<any>>(schema: T, value: unknown): value is z.infer<T> {
  const result = schema.safeParse(value);
  return result.success;
}

// Helper to get all values from an enum schema
export function getEnumValues<T extends z.ZodEnum<any>>(schema: T): z.infer<T>[] {
  return schema.options;
}

// Helper to get enum value or default
export function getEnumValueOrDefault<T extends z.ZodEnum<any>>(
  schema: T,
  value: unknown,
  defaultValue: z.infer<T>
): z.infer<T> {
  const result = schema.safeParse(value);
  return result.success ? result.data : defaultValue;
}

// ============================================
// EXPORT ALL SCHEMAS
// ============================================

export const SystemValidationSchemas = {
  // Business Entity
  BusinessEntityType: BusinessEntityTypeSchema,
  BusinessEntityStatus: BusinessEntityStatusSchema,
  BusinessEntityCategory: BusinessEntityCategorySchema,
  
  // Workspace
  WorkspaceMemberRole: WorkspaceMemberRoleSchema,
  
  // Company
  CompanyStatus: CompanyStatusSchema,
  CompanyType: CompanyTypeSchema,
  
  // Invitation
  InvitationStatus: InvitationStatusSchema,
  InvitationRole: InvitationRoleSchema,
  
  // Product
  ProductStatus: ProductStatusSchema,
  ProductType: ProductTypeSchema,
  ProductCategory: ProductCategorySchema,
  
  // Supplier
  SupplierStatus: SupplierStatusSchema,
  SupplierType: SupplierTypeSchema,
  SupplierRating: SupplierRatingSchema,
  
  // Customer
  CustomerStatus: CustomerStatusSchema,
  CustomerType: CustomerTypeSchema,
  CustomerSegment: CustomerSegmentSchema,
  
  // Order
  OrderStatus: OrderStatusSchema,
  OrderType: OrderTypeSchema,
  PaymentStatus: PaymentStatusSchema,
  PaymentMethod: PaymentMethodSchema,
  ShippingMethod: ShippingMethodSchema,
  
  // HR/Employee
  EmploymentType: EmploymentTypeSchema,
  EmployeeStatus: EmployeeStatusSchema,
  Department: DepartmentSchema,
  
  // General
  Gender: GenderSchema,
  MaritalStatus: MaritalStatusSchema,
  BloodType: BloodTypeSchema,
  EducationLevel: EducationLevelSchema,
  
  // Address
  AddressType: AddressTypeSchema,
  
  // Contact
  ContactType: ContactTypeSchema,
  PhoneType: PhoneTypeSchema,
  
  // Permission & Role
  PermissionAction: PermissionActionSchema,
  ResourceType: ResourceTypeSchema
};
