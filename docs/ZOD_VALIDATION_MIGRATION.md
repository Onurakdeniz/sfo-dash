# Zod-Based Validation System Migration Guide

## Overview

This guide explains the migration from database-level enums to Zod-based validation schemas. This approach provides more flexibility, better TypeScript integration, and easier maintenance of validation rules.

## Why Zod Instead of Database Enums?

### Benefits of Zod Validation

1. **Flexibility**: Easy to add, remove, or modify enum values without database migrations
2. **Type Safety**: Full TypeScript support with automatic type inference
3. **Runtime Validation**: Validate data at the application level with detailed error messages
4. **Composability**: Combine and extend schemas easily
5. **Better DX**: IntelliSense support and compile-time type checking
6. **Cross-Platform**: Same validation logic can be used in frontend and backend
7. **Custom Rules**: Add complex validation logic beyond simple enum checks

### Comparison

| Aspect | Database Enums | Zod Schemas |
|--------|---------------|-------------|
| **Flexibility** | Requires ALTER TYPE migrations | Simple code changes |
| **Type Safety** | Limited TypeScript support | Full type inference |
| **Validation** | Database constraint errors | Detailed, customizable errors |
| **Performance** | Database-level check | Application-level check |
| **Portability** | Database-specific | Platform agnostic |
| **Testing** | Requires database | Can test in isolation |

## Migration Strategy

### Step 1: Database Schema Changes

Change enum columns to VARCHAR:

```sql
-- Before (with enum)
CREATE TYPE request_status AS ENUM ('new', 'clarification', 'closed');
ALTER TABLE request ADD COLUMN status request_status;

-- After (with varchar)
ALTER TABLE request ADD COLUMN status VARCHAR(50);
```

### Step 2: Create Zod Schemas

```typescript
// src/lib/validations/request.ts
import { z } from 'zod';

export const RequestStatusSchema = z.enum([
  'new',
  'clarification',
  'supplier_inquiry',
  'closed'
]);

export type RequestStatus = z.infer<typeof RequestStatusSchema>;
```

### Step 3: Update Table Definitions

```typescript
// Before
import { requestStatusEnum } from '../enums';

export const request = pgTable('request', {
  status: requestStatusEnum('status').default('new').notNull(),
  // ...
});

// After
export const request = pgTable('request', {
  status: varchar('status', { length: 50 }).default('new').notNull(),
  // ...
});
```

## File Structure

```
src/lib/validations/
├── index.ts          # Main export file with utilities
├── request.ts        # Request system validations
├── talep.ts         # Legacy talep validations
├── system.ts        # System-wide validations
└── examples.ts      # Usage examples
```

## Usage Patterns

### 1. Basic Validation

```typescript
import { RequestStatusSchema } from '@/lib/validations';

// Validate a value
const result = RequestStatusSchema.safeParse('new');
if (result.success) {
  console.log('Valid status:', result.data);
} else {
  console.log('Invalid status');
}
```

### 2. In API Routes

```typescript
import { CreateRequestSchema, validateInput } from '@/lib/validations';

export async function POST(request: Request) {
  const body = await request.json();
  
  const validation = validateInput(CreateRequestSchema, body);
  
  if (!validation.success) {
    return Response.json({
      success: false,
      errors: validation.errors
    }, { status: 400 });
  }
  
  // Use validated data
  const requestData = validation.data;
  // ... save to database
}
```

### 3. Type-Safe Usage

```typescript
import type { RequestStatus, RequestPriority } from '@/lib/validations';

interface RequestData {
  status: RequestStatus;
  priority: RequestPriority;
}

// TypeScript ensures only valid values
const request: RequestData = {
  status: 'new',        // ✅ Valid
  priority: 'invalid'   // ❌ Type error
};
```

### 4. Form Validation

```typescript
import { CreateRequestSchema } from '@/lib/validations';

function validateForm(formData: FormData) {
  const data = Object.fromEntries(formData);
  
  try {
    const validated = CreateRequestSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.format() };
    }
    throw error;
  }
}
```

### 5. Database Queries

```typescript
import { RequestStatusSchema } from '@/lib/validations';
import { db } from '@/db';
import { request } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function getRequestsByStatus(status: unknown) {
  // Validate before querying
  const validatedStatus = RequestStatusSchema.parse(status);
  
  return await db
    .select()
    .from(request)
    .where(eq(request.status, validatedStatus));
}
```

## Available Validation Schemas

### Request System
- `RequestStatusSchema` - Request workflow states
- `RequestPrioritySchema` - Priority levels
- `RequestTypeSchema` - Request types (RFQ, RFI, etc.)
- `RequestCategorySchema` - Request categories
- `RequestItemStatusSchema` - Item-specific statuses
- `CommunicationTypeSchema` - Communication methods
- `ActionStatusSchema` - Action statuses
- `DeliveryTermsSchema` - Incoterms

### System-Wide
- `BusinessEntityTypeSchema` - Entity types
- `CompanyStatusSchema` - Company statuses
- `WorkspaceMemberRoleSchema` - Workspace roles
- `ProductStatusSchema` - Product statuses
- `OrderStatusSchema` - Order statuses
- `EmployeeStatusSchema` - Employee statuses
- And many more...

## Validation Utilities

### Core Functions

```typescript
// Validate with detailed result
validateInput(schema, data)

// Validate or throw error
validateInputOrThrow(schema, data)

// Partial validation for updates
validatePartial(schema, data)

// Batch validation
batchValidate(schema, items)

// Filter valid items
filterValid(schema, items)

// Format errors for API
formatValidationErrors(error)
```

### Enum Helpers

```typescript
// Create enum validator
const validator = createEnumValidator(schema);

// Check if valid
validator.isValid(value)

// Parse with default
validator.parse(value, defaultValue)

// Get all values
validator.values
```

### Type Guards

```typescript
// Check enum value
isEnumValue(value, schema)

// Check schema match
matchesSchema(value, schema)
```

## Migration Checklist

- [ ] Create Zod schemas for all enums
- [ ] Update database schema (enum → varchar)
- [ ] Update Drizzle table definitions
- [ ] Add validation to API routes
- [ ] Update frontend to use shared schemas
- [ ] Add validation tests
- [ ] Update documentation

## Best Practices

### 1. Centralize Schemas
Keep all validation schemas in `src/lib/validations` for easy maintenance.

### 2. Share Between Frontend and Backend
Export schemas from a shared package if using monorepo.

### 3. Validate Early
Validate data as soon as it enters your system (API routes, form submissions).

### 4. Use Type Inference
Let TypeScript infer types from schemas:
```typescript
type RequestStatus = z.infer<typeof RequestStatusSchema>;
```

### 5. Custom Error Messages
Provide helpful error messages:
```typescript
z.string().min(10, 'Title must be at least 10 characters')
```

### 6. Compose Schemas
Build complex schemas from simple ones:
```typescript
const ExtendedSchema = BaseSchema.extend({
  newField: z.string()
});
```

## Performance Considerations

### Application-Level Validation
- Validation happens in memory (very fast)
- No database round-trip for constraint violations
- Can validate before database operations

### Caching
- Schema compilation is cached by Zod
- Enum values are constants (no runtime cost)

### Bundle Size
- Zod is ~8kb gzipped
- Tree-shakeable - only import what you use

## Troubleshooting

### Common Issues

1. **Type Mismatch**
   ```typescript
   // Problem: Database returns string, expects enum
   // Solution: Validate after fetching
   const data = await db.query();
   const validated = schema.parse(data);
   ```

2. **Migration Errors**
   ```sql
   -- If enum column has constraints
   ALTER TABLE request DROP CONSTRAINT request_status_check;
   ALTER TABLE request ALTER COLUMN status TYPE VARCHAR(50);
   ```

3. **Default Values**
   ```typescript
   // Ensure defaults match schema
   status: varchar('status', { length: 50 })
     .default('new') // Must be valid enum value
   ```

## Example: Complete Request System Migration

### Before (Database Enums)

```typescript
// Enum definition
export const requestStatusEnum = pgEnum("request_status", [
  "new", "closed"
]);

// Table
export const request = pgTable('request', {
  status: requestStatusEnum('status').default('new')
});

// Usage
const status = 'new'; // No type safety
```

### After (Zod Validation)

```typescript
// Schema definition
export const RequestStatusSchema = z.enum(['new', 'closed']);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

// Table
export const request = pgTable('request', {
  status: varchar('status', { length: 50 }).default('new')
});

// Usage
const status: RequestStatus = 'new'; // Full type safety

// Validation
const validated = RequestStatusSchema.parse(userInput);
```

## Conclusion

Migrating to Zod-based validation provides:
- ✅ More flexibility
- ✅ Better developer experience
- ✅ Stronger type safety
- ✅ Easier maintenance
- ✅ Cross-platform compatibility

The initial migration effort is offset by long-term benefits in maintainability and development speed.
