/**
 * Central export point for all validation schemas and utilities
 * 
 * This module provides Zod-based validation schemas for the entire system,
 * replacing database-level enums with flexible application-level validation.
 */

// Export all validation schemas
export * from './request';
export * from './talep';
export * from './system';

// Re-export Zod for convenience
export { z } from 'zod';

// ============================================
// COMPOSITE VALIDATION SCHEMAS
// ============================================

import { z } from 'zod';
import { RequestStatusSchema, RequestPrioritySchema, RequestTypeSchema } from './request';
import { CurrencySchema, UnitOfMeasureSchema } from './request';

/**
 * Request creation validation schema
 */
export const CreateRequestSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: RequestTypeSchema,
  priority: RequestPrioritySchema,
  customerId: z.string().uuid(),
  customerContactId: z.string().uuid().optional(),
  requestedDeliveryDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional()
});

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;

/**
 * Request item validation schema
 */
export const RequestItemSchema = z.object({
  productCode: z.string().max(100).optional(),
  productName: z.string().min(1).max(500),
  description: z.string().optional(),
  manufacturer: z.string().max(255).optional(),
  requestedQuantity: z.number().positive(),
  unitOfMeasure: UnitOfMeasureSchema,
  targetPrice: z.number().positive().optional(),
  currency: CurrencySchema,
  requiredByDate: z.date().optional(),
  specifications: z.record(z.unknown()).optional(),
  certificationRequired: z.array(z.string()).optional()
});

export type RequestItemInput = z.infer<typeof RequestItemSchema>;

/**
 * Request status update validation schema
 */
export const UpdateRequestStatusSchema = z.object({
  status: RequestStatusSchema,
  reason: z.string().optional(),
  notes: z.string().optional()
});

export type UpdateRequestStatusInput = z.infer<typeof UpdateRequestStatusSchema>;

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validates input against a schema and returns typed result
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(input);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error };
}

/**
 * Validates input and throws if invalid
 */
export function validateInputOrThrow<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): T {
  return schema.parse(input);
}

/**
 * Partially validates an object (for updates)
 */
export function validatePartial<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): Partial<T> {
  const partialSchema = schema.partial();
  return partialSchema.parse(input);
}

/**
 * Validates array of items
 */
export function validateArray<T>(
  itemSchema: z.ZodSchema<T>,
  input: unknown
): T[] {
  const arraySchema = z.array(itemSchema);
  return arraySchema.parse(input);
}

/**
 * Custom error formatter for API responses
 */
export function formatValidationErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });
  
  return formatted;
}

/**
 * Creates a validated enum getter with fallback
 */
export function createEnumValidator<T extends readonly [string, ...string[]]>(
  schema: z.ZodEnum<T>
) {
  return {
    validate: (value: unknown): value is T[number] => {
      return schema.safeParse(value).success;
    },
    parse: (value: unknown, defaultValue: T[number]): T[number] => {
      const result = schema.safeParse(value);
      return result.success ? result.data : defaultValue;
    },
    values: schema.options,
    isValid: (value: unknown): boolean => {
      return schema.safeParse(value).success;
    }
  };
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard for checking if a value is a valid enum value
 */
export function isEnumValue<T extends readonly [string, ...string[]]>(
  value: unknown,
  schema: z.ZodEnum<T>
): value is T[number] {
  return schema.safeParse(value).success;
}

/**
 * Type guard for checking if an object matches a schema
 */
export function matchesSchema<T>(
  value: unknown,
  schema: z.ZodSchema<T>
): value is T {
  return schema.safeParse(value).success;
}

// ============================================
// COMMON VALIDATION PATTERNS
// ============================================

/**
 * Email validation schema
 */
export const EmailSchema = z.string().email().toLowerCase();

/**
 * Phone number validation schema (international format)
 */
export const PhoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format'
);

/**
 * URL validation schema
 */
export const UrlSchema = z.string().url();

/**
 * UUID validation schema
 */
export const UuidSchema = z.string().uuid();

/**
 * Date string validation schema (ISO format)
 */
export const DateStringSchema = z.string().datetime();

/**
 * Positive number validation schema
 */
export const PositiveNumberSchema = z.number().positive();

/**
 * Percentage validation schema (0-100)
 */
export const PercentageSchema = z.number().min(0).max(100);

/**
 * Money/decimal validation schema
 */
export const MoneySchema = z.number().multipleOf(0.01).nonnegative();

/**
 * Slug validation schema
 */
export const SlugSchema = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  'Invalid slug format'
);

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

/**
 * Creates Express/API middleware for request validation
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      throw new ValidationError('Validation failed', formatValidationErrors(result.error));
    }
    
    return result.data;
  };
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================
// BATCH VALIDATION
// ============================================

/**
 * Validates multiple items and returns results
 */
export function batchValidate<T>(
  schema: z.ZodSchema<T>,
  items: unknown[]
): Array<{ index: number; success: boolean; data?: T; error?: z.ZodError }> {
  return items.map((item, index) => {
    const result = schema.safeParse(item);
    
    if (result.success) {
      return { index, success: true, data: result.data };
    }
    
    return { index, success: false, error: result.error };
  });
}

/**
 * Filters valid items from an array
 */
export function filterValid<T>(
  schema: z.ZodSchema<T>,
  items: unknown[]
): T[] {
  return items
    .map(item => schema.safeParse(item))
    .filter(result => result.success)
    .map(result => (result as z.SafeParseSuccess<T>).data);
}