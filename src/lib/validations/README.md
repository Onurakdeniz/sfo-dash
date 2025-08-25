# Validation System with Zod

## Overview

This directory contains all Zod-based validation schemas for the application. These schemas replace database-level enums with flexible, type-safe validation at the application level.

## Structure

```
src/lib/validations/
├── index.ts       # Main export and utilities
├── request.ts     # Request system validations
├── talep.ts      # Legacy talep validations
├── system.ts     # System-wide validations
├── examples.ts   # Usage examples
└── README.md     # This file
```

## Quick Start

### Basic Usage

```typescript
import { RequestStatusSchema, validateInput } from '@/lib/validations';

// Validate a status
const status = RequestStatusSchema.parse('new'); // Type: RequestStatus

// Validate with error handling
const result = validateInput(RequestStatusSchema, userInput);
if (result.success) {
  console.log('Valid:', result.data);
} else {
  console.log('Errors:', result.errors);
}
```

### In API Routes

```typescript
import { CreateRequestSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate request data
  const validated = CreateRequestSchema.parse(body);
  
  // Save to database (varchar fields)
  await db.insert(requestTable).values({
    ...validated,
    status: validated.status, // Already validated
  });
}
```

### Database Integration

The database tables use VARCHAR fields instead of enums:

```sql
-- Database schema (simplified)
CREATE TABLE request (
  status VARCHAR(50) DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'medium',
  type VARCHAR(50) DEFAULT 'general_inquiry'
);
```

Validation happens in the application:

```typescript
// Before saving to database
const validatedStatus = RequestStatusSchema.parse(input.status);

// Before querying
const requests = await db
  .select()
  .from(request)
  .where(eq(request.status, validatedStatus));
```

## Available Schemas

### Request System (`request.ts`)
- `RequestStatusSchema` - Workflow states
- `RequestPrioritySchema` - Priority levels
- `RequestTypeSchema` - Request types (RFQ, RFI, etc.)
- `RequestCategorySchema` - Categories
- `RequestItemStatusSchema` - Item statuses
- `CommunicationTypeSchema` - Communication methods
- `ActionStatusSchema` - Action statuses
- `DeliveryTermsSchema` - Incoterms
- And more...

### Legacy Talep (`talep.ts`)
- `TalepStatusSchema` - Status values
- `TalepPrioritySchema` - Priority levels
- `TalepTypeSchema` - Request types
- `TalepCategorySchema` - Categories

### System-Wide (`system.ts`)
- `BusinessEntityTypeSchema` - Entity types
- `CompanyStatusSchema` - Company statuses
- `WorkspaceMemberRoleSchema` - Workspace roles
- `ProductStatusSchema` - Product statuses
- `OrderStatusSchema` - Order statuses
- And many more...

## Utilities

### Validation Functions

```typescript
// Safe validation with result
validateInput(schema, data)

// Validation with exception
validateInputOrThrow(schema, data)

// Partial validation (for updates)
validatePartial(schema, data)

// Batch validation
batchValidate(schema, items)

// Filter valid items
filterValid(schema, items)
```

### Enum Helpers

```typescript
// Create enum validator
const validator = createEnumValidator(RequestStatusSchema);

// Check validity
validator.isValid('new') // true

// Parse with default
validator.parse(input, 'new')

// Get all values
validator.values // ['new', 'clarification', ...]
```

### Type Guards

```typescript
// Check enum value
if (isEnumValue(value, RequestStatusSchema)) {
  // value is typed as RequestStatus
}

// Check schema match
if (matchesSchema(value, CreateRequestSchema)) {
  // value is typed as CreateRequestInput
}
```

## Workflow Helpers

For request status transitions:

```typescript
// Check if transition is valid
isValidStatusTransition('new', 'clarification') // true

// Get next valid statuses
getNextValidStatuses('new') // ['clarification', 'cancelled', 'on_hold']

// Check if status is final
isFinalStatus('closed') // true

// Check if status is active
isActiveStatus('new') // true
```

## Type Safety

All schemas provide TypeScript types:

```typescript
import type { 
  RequestStatus,
  RequestPriority,
  RequestType 
} from '@/lib/validations';

// Use in interfaces
interface Request {
  status: RequestStatus;
  priority: RequestPriority;
  type: RequestType;
}
```

## Migration from DB Enums

### Before (Database Enums)
```typescript
// Enum in database
export const requestStatusEnum = pgEnum("request_status", [...]);

// Table definition
status: requestStatusEnum('status').default('new')
```

### After (Zod Validation)
```typescript
// Zod schema
export const RequestStatusSchema = z.enum([...]);

// Table definition  
status: varchar('status', { length: 50 }).default('new')

// Validation in app
const status = RequestStatusSchema.parse(input);
```

## Best Practices

1. **Always validate input data** before saving to database
2. **Use type inference** from schemas for TypeScript types
3. **Handle validation errors** gracefully in API responses
4. **Validate query parameters** before using in database queries
5. **Use validation utilities** for consistent error handling

## Error Handling

```typescript
try {
  const validated = RequestStatusSchema.parse(input);
  // Use validated data
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation error
    const formatted = formatValidationErrors(error);
    return { errors: formatted };
  }
  throw error;
}
```

## Testing

```typescript
import { RequestStatusSchema } from '@/lib/validations';

describe('Request Status Validation', () => {
  it('accepts valid status', () => {
    expect(() => RequestStatusSchema.parse('new')).not.toThrow();
  });
  
  it('rejects invalid status', () => {
    expect(() => RequestStatusSchema.parse('invalid')).toThrow();
  });
});
```

## Performance

- Validation is very fast (microseconds)
- Schemas are cached by Zod
- No database round-trip for constraint violations
- Can validate before expensive operations

## Support

For questions or issues, refer to:
- `/workspace/docs/ZOD_VALIDATION_MIGRATION.md` - Migration guide
- `/workspace/src/lib/validations/examples.ts` - Usage examples
- Zod documentation: https://zod.dev