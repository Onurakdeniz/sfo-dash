/**
 * Examples of using Zod validation schemas in the application
 * 
 * This file demonstrates how to use the validation schemas
 * instead of database-level enums for flexible validation.
 */

import {
  RequestStatusSchema,
  RequestPrioritySchema,
  CreateRequestSchema,
  RequestItemSchema,
  validateInput,
  validateInputOrThrow,
  formatValidationErrors,
  isValidStatusTransition,
  getNextValidStatuses,
  createEnumValidator,
  type RequestStatus,
  type RequestPriority
} from './index';

// ============================================
// EXAMPLE 1: Basic Enum Validation
// ============================================

export function validateRequestStatus(status: unknown): RequestStatus | null {
  const result = RequestStatusSchema.safeParse(status);
  return result.success ? result.data : null;
}

// Usage example:
// const status = validateRequestStatus('new'); // Returns 'new'
// const invalid = validateRequestStatus('invalid'); // Returns null

// ============================================
// EXAMPLE 2: Using Enum Validator Helper
// ============================================

const statusValidator = createEnumValidator(RequestStatusSchema);

export function processRequestStatus(input: unknown) {
  // Check if valid
  if (!statusValidator.isValid(input)) {
    console.log('Invalid status provided');
    return 'new'; // Default value
  }
  
  // Parse with default
  const status = statusValidator.parse(input, 'new');
  
  // Get all possible values
  const allStatuses = statusValidator.values;
  console.log('Available statuses:', allStatuses);
  
  return status;
}

// ============================================
// EXAMPLE 3: API Route Handler
// ============================================

export async function createRequestHandler(body: unknown) {
  // Validate input
  const validation = validateInput(CreateRequestSchema, body);
  
  if (!validation.success) {
    // Return formatted errors for API response
    return {
      success: false,
      errors: formatValidationErrors(validation.errors)
    };
  }
  
  // Use validated data
  const requestData = validation.data;
  
  // Create request in database
  // ... database operations ...
  
  return {
    success: true,
    data: requestData
  };
}

// ============================================
// EXAMPLE 4: Status Transition Validation
// ============================================

export function updateRequestStatus(
  currentStatus: RequestStatus,
  newStatus: unknown
): { valid: boolean; message?: string } {
  // Validate new status
  const statusResult = RequestStatusSchema.safeParse(newStatus);
  
  if (!statusResult.success) {
    return {
      valid: false,
      message: 'Invalid status value provided'
    };
  }
  
  // Check if transition is valid
  if (!isValidStatusTransition(currentStatus, statusResult.data)) {
    const validStatuses = getNextValidStatuses(currentStatus);
    return {
      valid: false,
      message: `Cannot transition from ${currentStatus} to ${statusResult.data}. Valid transitions: ${validStatuses.join(', ')}`
    };
  }
  
  return { valid: true };
}

// ============================================
// EXAMPLE 5: Form Validation
// ============================================

export function validateRequestForm(formData: FormData) {
  // Convert FormData to object
  const data = {
    title: formData.get('title'),
    description: formData.get('description'),
    type: formData.get('type'),
    priority: formData.get('priority'),
    customerId: formData.get('customerId'),
    requestedDeliveryDate: formData.get('requestedDeliveryDate')
      ? new Date(formData.get('requestedDeliveryDate') as string)
      : undefined
  };
  
  try {
    // Validate and throw if invalid
    const validated = validateInputOrThrow(CreateRequestSchema, data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Validation failed' };
  }
}

// ============================================
// EXAMPLE 6: Database Query with Validation
// ============================================

import { db } from '@/db'; // Your database instance
import { request } from '@/db/schema/tables/request';
import { eq } from 'drizzle-orm';

export async function getRequestsByStatus(status: unknown) {
  // Validate status before querying
  const validatedStatus = RequestStatusSchema.safeParse(status);
  
  if (!validatedStatus.success) {
    throw new Error(`Invalid status: ${status}`);
  }
  
  // Now we can safely query with validated status
  const requests = await db
    .select()
    .from(request)
    .where(eq(request.status, validatedStatus.data));
  
  return requests;
}

// ============================================
// EXAMPLE 7: Bulk Validation
// ============================================

import { batchValidate, filterValid } from './index';

export function processRequestItems(items: unknown[]) {
  // Validate all items
  const results = batchValidate(RequestItemSchema, items);
  
  // Separate valid and invalid items
  const validItems = results
    .filter(r => r.success)
    .map(r => r.data!);
  
  const invalidItems = results
    .filter(r => !r.success)
    .map(r => ({
      index: r.index,
      errors: formatValidationErrors(r.error!)
    }));
  
  // Or use filterValid helper
  const validItemsAlt = filterValid(RequestItemSchema, items);
  
  return {
    valid: validItems,
    invalid: invalidItems,
    totalValid: validItems.length,
    totalInvalid: invalidItems.length
  };
}

// ============================================
// EXAMPLE 8: Custom Validation Rules
// ============================================

import { z } from 'zod';

// Extend existing schema with custom rules
export const ExtendedRequestSchema = CreateRequestSchema.extend({
  // Add custom validation for title
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must not exceed 200 characters')
    .regex(/^[A-Z]/, 'Title must start with capital letter'),
  
  // Add custom field
  internalCode: z.string()
    .regex(/^REQ-\d{4}-\d{3}$/, 'Invalid request code format'),
  
  // Add conditional validation
  urgentReason: z.string().optional()
}).refine(
  // If priority is urgent, urgentReason is required
  (data) => {
    if (data.priority === 'urgent' || data.priority === 'critical') {
      return !!data.urgentReason && data.urgentReason.length > 0;
    }
    return true;
  },
  {
    message: 'Urgent reason is required for urgent/critical priority',
    path: ['urgentReason']
  }
);

// ============================================
// EXAMPLE 9: Type-safe Enum Usage
// ============================================

export class RequestService {
  // Use types derived from schemas
  private defaultPriority: RequestPriority = 'medium';
  private defaultStatus: RequestStatus = 'new';
  
  // Method with type-safe parameters
  createRequest(
    title: string,
    priority: RequestPriority = this.defaultPriority,
    status: RequestStatus = this.defaultStatus
  ) {
    // TypeScript ensures only valid enum values can be passed
    return {
      title,
      priority,
      status,
      createdAt: new Date()
    };
  }
  
  // Get all valid values for dropdowns
  getStatusOptions() {
    return RequestStatusSchema.options;
  }
  
  getPriorityOptions() {
    return RequestPrioritySchema.options;
  }
}

// ============================================
// EXAMPLE 10: Migration from DB Enums
// ============================================

/**
 * Example of migrating from database enums to Zod validation
 * 
 * Before (with DB enums):
 * ```sql
 * CREATE TYPE request_status AS ENUM ('new', 'clarification', ...);
 * ALTER TABLE request ADD COLUMN status request_status;
 * ```
 * 
 * After (with Zod):
 * ```sql
 * ALTER TABLE request ADD COLUMN status VARCHAR(50);
 * ```
 * 
 * Then validate in application:
 */
export async function saveRequest(data: unknown) {
  // Validate entire request object
  const validated = CreateRequestSchema.parse(data);
  
  // Save to database with varchar fields
  // The database stores plain strings, validation happens in app
  const result = await db.insert(request).values({
    ...validated,
    id: crypto.randomUUID(),
    workspaceId: 'workspace-id',
    companyId: 'company-id',
    requestNumber: generateRequestNumber(),
    createdBy: 'user-id'
  });
  
  return result;
}

function generateRequestNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REQ-${year}-${random}`;
}