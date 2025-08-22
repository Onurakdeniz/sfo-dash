/**
 * Database Error Handling Utility
 *
 * This utility converts database constraint violations and errors
 * into user-friendly messages that can be displayed in the frontend.
 */

export interface DatabaseError {
  code: string;
  message: string;
  userMessage: string;
  field?: string;
}

export class DatabaseErrorHandler {
  private static constraintMap: Record<string, DatabaseError> = {
    // Email validation constraints
    'user_email_format_check': {
      code: 'INVALID_EMAIL_FORMAT',
      message: 'Email format is invalid',
      userMessage: 'Please enter a valid email address',
      field: 'email'
    },
    'user_email_unique': {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'Email already exists',
      userMessage: 'This email address is already registered',
      field: 'email'
    },
    'companies_email_check': {
      code: 'INVALID_COMPANY_EMAIL',
      message: 'Company email format is invalid',
      userMessage: 'Please enter a valid company email address',
      field: 'email'
    },

    // Phone validation constraints
    'companies_phone_check': {
      code: 'INVALID_PHONE_FORMAT',
      message: 'Phone format is invalid',
      userMessage: 'Please enter a valid phone number (e.g., +90 555 123 4567)',
      field: 'phone'
    },
    'companies_phone_format_check': {
      code: 'PHONE_TOO_SHORT',
      message: 'Phone number too short',
      userMessage: 'Phone number must be at least 10 digits',
      field: 'phone'
    },
    'company_locations_phone_check': {
      code: 'INVALID_LOCATION_PHONE',
      message: 'Location phone format is invalid',
      userMessage: 'Please enter a valid phone number for this location',
      field: 'phone'
    },

    // Tax number validation constraints
    'companies_tax_number_check': {
      code: 'INVALID_TAX_NUMBER',
      message: 'Tax number format is invalid',
      userMessage: 'Turkish tax number must be exactly 10 digits',
      field: 'taxNumber'
    },
    'companies_mersis_number_check': {
      code: 'INVALID_MERSIS_NUMBER',
      message: 'Mersis number format is invalid',
      userMessage: 'Mersis number must be exactly 16 digits',
      field: 'mersisNumber'
    },
    'companies_tax_number_unique': {
      code: 'TAX_NUMBER_EXISTS',
      message: 'Tax number already exists',
      userMessage: 'This tax number is already registered to another company',
      field: 'taxNumber'
    },
    'companies_mersis_number_unique': {
      code: 'MERSIS_NUMBER_EXISTS',
      message: 'Mersis number already exists',
      userMessage: 'This Mersis number is already registered to another company',
      field: 'mersisNumber'
    },

    // Postal code validation
    'companies_postal_code_check': {
      code: 'INVALID_POSTAL_CODE',
      message: 'Postal code format is invalid',
      userMessage: 'Postal code must be exactly 5 digits',
      field: 'postalCode'
    },
    'company_locations_postal_code_check': {
      code: 'INVALID_LOCATION_POSTAL_CODE',
      message: 'Location postal code format is invalid',
      userMessage: 'Location postal code must be exactly 5 digits',
      field: 'postalCode'
    },

    // Website validation
    'companies_website_check': {
      code: 'INVALID_WEBSITE_FORMAT',
      message: 'Website format is invalid',
      userMessage: 'Please enter a valid website URL (e.g., https://example.com)',
      field: 'website'
    },

    // Username validation
    'user_username_format_check': {
      code: 'INVALID_USERNAME_FORMAT',
      message: 'Username format is invalid',
      userMessage: 'Username can only contain letters, numbers, underscores, and dashes',
      field: 'username'
    },
    'user_username_unique': {
      code: 'USERNAME_ALREADY_EXISTS',
      message: 'Username already exists',
      userMessage: 'This username is already taken',
      field: 'username'
    },

    // Name validation
    'user_name_length_check': {
      code: 'INVALID_NAME_LENGTH',
      message: 'Name length is invalid',
      userMessage: 'Name must be between 2 and 100 characters',
      field: 'name'
    },

    // Currency validation
    'companies_currency_check': {
      code: 'INVALID_CURRENCY_FORMAT',
      message: 'Currency format is invalid',
      userMessage: 'Currency must be a valid 3-letter code (e.g., TRY, USD, EUR)',
      field: 'defaultCurrency'
    },

    // Permission scope validation
    'role_module_permissions_scope_exclusive_check': {
      code: 'INVALID_PERMISSION_SCOPE',
      message: 'Invalid permission scope combination',
      userMessage: 'Permission must apply to either a workspace or company, not both',
      field: 'scope'
    },
    'role_module_permissions_scope_required_check': {
      code: 'MISSING_PERMISSION_SCOPE',
      message: 'Permission scope is required',
      userMessage: 'Permission must be assigned to a workspace or company',
      field: 'scope'
    },

    // Country validation
    'company_locations_country_check': {
      code: 'MISSING_COUNTRY',
      message: 'Country is required',
      userMessage: 'Please specify the country for this location',
      field: 'country'
    }
  };

  /**
   * Parse a database error and convert it to a user-friendly format
   */
  static parseError(error: any): DatabaseError | null {
    if (!error) return null;

    // Handle nested errors (like in Drizzle/PostgreSQL)
    const actualError = error.cause || error;

    console.log("Parsing error:", {
      code: actualError.code,
      constraint: actualError.constraint,
      message: actualError.message,
      hasCause: !!error.cause
    });

    // Extract constraint name from message if not available in constraint property
    let constraintName = actualError.constraint;
    if (!constraintName && actualError.message) {
      // Try to extract constraint name from message like "violates check constraint "constraint_name""
      const constraintMatch = actualError.message.match(/violates check constraint "([^"]+)"/);
      if (constraintMatch) {
        constraintName = constraintMatch[1];
        console.log("Extracted constraint from message:", constraintName);
      }
    }

    // Handle PostgreSQL errors
    if (actualError.code && constraintName) {
      console.log("Looking up constraint:", constraintName);
      const constraintError = this.constraintMap[constraintName];
      if (constraintError) {
        console.log("Found constraint error:", constraintError);
        return constraintError;
      }
      console.log("Constraint not found in map:", constraintName);
    }

    // Handle unique constraint violations
    if (actualError.code === '23505' && constraintName) {
      const constraintError = this.constraintMap[constraintName];
      if (constraintError) {
        return constraintError;
      }
    }

    // Handle check constraint violations
    if (actualError.code === '23514' && constraintName) {
      console.log("Check constraint violation:", constraintName);
      const constraintError = this.constraintMap[constraintName];
      if (constraintError) {
        console.log("Found check constraint error:", constraintError);
        return constraintError;
      }
      console.log("Check constraint not found in map:", constraintName);
    }

    // Handle foreign key violations
    if (actualError.code === '23503') {
      return {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced record does not exist',
        userMessage: 'The referenced record was not found. Please check your data and try again.',
        field: 'reference'
      };
    }

    // Handle not null violations
    if (actualError.code === '23502') {
      return {
        code: 'NOT_NULL_VIOLATION',
        message: 'Required field is missing',
        userMessage: 'A required field is missing. Please fill in all required fields.',
        field: actualError.column
      };
    }

    // Default error
    return {
      code: 'DATABASE_ERROR',
      message: actualError.message || 'An unexpected database error occurred',
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    };
  }

  /**
   * Create a standardized API error response
   */
  static createErrorResponse(error: any) {
    const parsedError = this.parseError(error);

    return {
      success: false,
      error: parsedError || {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        userMessage: 'Something went wrong. Please try again.'
      }
    };
  }

  /**
   * Check if an error is a constraint violation
   */
  static isConstraintViolation(error: any): boolean {
    const actualError = error?.cause || error;
    return actualError?.code && ['23505', '23514', '23503', '23502'].includes(actualError.code);
  }
}

/**
 * Higher-order function to wrap database operations with error handling
 */
export function withDatabaseErrorHandling<T extends any[], R>(
  operation: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<{ success: true; data: R } | { success: false; error: DatabaseError }> => {
    try {
      const result = await operation(...args);
      return { success: true, data: result };
    } catch (error) {
      console.error('Database operation failed:', error);
      return DatabaseErrorHandler.createErrorResponse(error);
    }
  };
}

