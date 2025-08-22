# Database Error Handling System

This system provides comprehensive error handling for database constraint violations with user-friendly notifications using sonner.

## Overview

The system consists of:

1. **Backend Error Handler** (`database-errors.ts`) - Parses database errors and converts them to user-friendly messages
2. **Frontend Error Handler** (`api-error-handler.ts`) - Handles API responses and shows sonner notifications
3. **Example Components** - Demonstrates usage patterns

## Backend Usage

### Basic Error Handling

```typescript
import { DatabaseErrorHandler, withDatabaseErrorHandling } from "@/lib/database-errors";

// Method 1: Using the wrapper function
const result = await withDatabaseErrorHandling(async () => {
  return await db.insert(user).values({
    name: "John Doe",
    email: "john@example.com",
    // ... other fields
  }).returning();
});

if (!result.success) {
  return NextResponse.json(
    { success: false, error: result.error },
    { status: 400 }
  );
}

// Method 2: Manual error parsing
try {
  await db.insert(user).values(userData);
} catch (error) {
  const parsedError = DatabaseErrorHandler.parseError(error);
  if (parsedError) {
    return NextResponse.json(
      { success: false, error: parsedError },
      { status: 400 }
    );
  }
}
```

### Supported Constraint Violations

| Constraint | Error Code | User Message |
|------------|------------|--------------|
| Email format | `INVALID_EMAIL_FORMAT` | "Please enter a valid email address" |
| Email unique | `EMAIL_ALREADY_EXISTS` | "This email address is already registered" |
| Phone format | `INVALID_PHONE_FORMAT` | "Please enter a valid phone number" |
| Tax number | `INVALID_TAX_NUMBER` | "Turkish tax number must be exactly 10 digits" |
| Mersis number | `INVALID_MERSIS_NUMBER` | "Mersis number must be exactly 16 digits" |
| Username format | `INVALID_USERNAME_FORMAT` | "Username can only contain letters, numbers, underscores, and dashes" |
| Permission scope | `INVALID_PERMISSION_SCOPE` | "Permission must apply to either a workspace or company, not both" |

## Frontend Usage

### Basic API Response Handling

```typescript
import { handleApiResponse } from "@/lib/api-error-handler";

const response = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify(userData),
});

const data = await response.json();
const result = handleApiResponse(data, {
  successMessage: "User created successfully!",
  showSuccessToast: true,
});
```

### Form Error Handling

```typescript
import { useFormErrorHandler } from "@/lib/api-error-handler";

function UserForm() {
  const { handleSubmit } = useFormErrorHandler();
  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    await handleSubmit(
      async () => {
        const response = await fetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return response.json();
      },
      {
        successMessage: "User created successfully!",
        onSuccess: (data) => {
          console.log("Created user:", data);
          form.reset();
        },
        setError: form.setError, // For field-specific errors
      }
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  );
}
```

### Manual Error Display

```typescript
import { showErrorToast } from "@/lib/api-error-handler";

// Show a specific error
showErrorToast({
  code: 'INVALID_EMAIL_FORMAT',
  message: 'Email format is invalid',
  userMessage: 'Please enter a valid email address',
  field: 'email'
});
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMAIL_FORMAT",
    "message": "Email format is invalid",
    "userMessage": "Please enter a valid email address",
    "field": "email"
  }
}
```

## Adding New Constraint Errors

To add support for new constraint violations:

### Backend (database-errors.ts)

```typescript
private static constraintMap: Record<string, DatabaseError> = {
  // Add new constraint
  'your_constraint_name': {
    code: 'YOUR_ERROR_CODE',
    message: 'Technical error message',
    userMessage: 'User-friendly message',
    field: 'field_name' // optional
  },
  // ... existing constraints
};
```

### Frontend (api-error-handler.ts)

```typescript
const errorConfig = {
  // Add new error code
  YOUR_ERROR_CODE: { type: 'warning', icon: '⚠️' },
  // ... existing codes
};
```

## Error Types and Icons

- **Warning (⚠️)**: Validation errors, duplicate data
- **Error (❌)**: System errors, foreign key violations
- **Info (ℹ️)**: General information messages
- **Success (✅)**: Successful operations

## Best Practices

1. **Always use the error handlers** in API routes to ensure consistent error responses
2. **Use field-specific errors** in forms for better UX
3. **Log technical errors** on the backend while showing user-friendly messages
4. **Test error scenarios** to ensure proper handling
5. **Keep user messages clear and actionable**

## Examples

See the example files:
- Backend: `/api/examples/database-errors/route.ts`
- Frontend: `/components/examples/DatabaseErrorExample.tsx`

