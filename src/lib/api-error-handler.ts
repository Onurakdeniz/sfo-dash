/**
 * API Error Handler for Frontend
 *
 * This utility handles API responses and shows user-friendly notifications
 * using sonner for database constraint violations and other errors.
 */

import { toast } from "sonner";

export interface ApiError {
  code: string;
  message: string;
  userMessage: string;
  field?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Handle API response and show appropriate notifications
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  options: {
    successMessage?: string;
    showSuccessToast?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  } = {}
) {
  const {
    successMessage,
    showSuccessToast = true,
    onSuccess,
    onError
  } = options;

  if (response.success) {
    if (showSuccessToast && successMessage) {
      toast.success(successMessage);
    }
    if (onSuccess && response.data) {
      onSuccess(response.data);
    }
    return response.data ?? null;
  } else if (response.error) {
    showErrorToast(response.error);
    if (onError) {
      onError(response.error);
    }
    return null;
  }

  return null;
}

/**
 * Show error toast based on error type
 */
export function showErrorToast(error: ApiError) {
  // Map error codes to toast types and messages
  const errorConfig = {
    // Validation errors - show as warnings
    INVALID_EMAIL_FORMAT: { type: 'warning', icon: '⚠️' },
    INVALID_PHONE_FORMAT: { type: 'warning', icon: '⚠️' },
    INVALID_NAME_LENGTH: { type: 'warning', icon: '⚠️' },
    INVALID_USERNAME_FORMAT: { type: 'warning', icon: '⚠️' },
    INVALID_TAX_NUMBER: { type: 'warning', icon: '⚠️' },
    INVALID_MERSIS_NUMBER: { type: 'warning', icon: '⚠️' },
    INVALID_POSTAL_CODE: { type: 'warning', icon: '⚠️' },
    INVALID_WEBSITE_FORMAT: { type: 'warning', icon: '⚠️' },
    INVALID_CURRENCY_FORMAT: { type: 'warning', icon: '⚠️' },
    MISSING_COUNTRY: { type: 'warning', icon: '⚠️' },
    INVALID_PERMISSION_SCOPE: { type: 'warning', icon: '⚠️' },
    MISSING_PERMISSION_SCOPE: { type: 'warning', icon: '⚠️' },

    // Duplicate data errors - show as warnings
    EMAIL_ALREADY_EXISTS: { type: 'warning', icon: '📧' },
    USERNAME_ALREADY_EXISTS: { type: 'warning', icon: '👤' },
    TAX_NUMBER_EXISTS: { type: 'warning', icon: '🏢' },
    MERSIS_NUMBER_EXISTS: { type: 'warning', icon: '🏢' },

    // Business logic errors - show as errors
    FOREIGN_KEY_VIOLATION: { type: 'error', icon: '❌' },
    NOT_NULL_VIOLATION: { type: 'error', icon: '❌' },
    INVALID_COMPANY_EMAIL: { type: 'warning', icon: '⚠️' },
    INVALID_LOCATION_PHONE: { type: 'warning', icon: '⚠️' },
    INVALID_LOCATION_POSTAL_CODE: { type: 'warning', icon: '⚠️' },
    PHONE_TOO_SHORT: { type: 'warning', icon: '⚠️' },

    // Default error
    default: { type: 'error', icon: '❌' }
  };

  const config = errorConfig[error.code as keyof typeof errorConfig] || errorConfig.default;

  const message = `${config.icon} ${error.userMessage}`;

  if (config.type === 'warning') {
    toast.warning(message, {
      description: error.field ? `Field: ${error.field}` : undefined,
      duration: 5000,
    });
  } else {
    toast.error(message, {
      description: error.field ? `Field: ${error.field}` : undefined,
      duration: 5000,
    });
  }
}

/**
 * Generic API call wrapper with error handling
 */
export async function apiCall<T = any>(
  apiFunction: () => Promise<Response>,
  options: {
    successMessage?: string;
    showSuccessToast?: boolean;
    errorMessage?: string;
  } = {}
): Promise<T | null> {
  try {
    const response = await apiFunction();
    const data: ApiResponse<T> = await response.json();

    return handleApiResponse(data, options);
  } catch (error) {
    console.error('API call failed:', error);
    toast.error('Network error. Please check your connection and try again.');
    return null;
  }
}

/**
 * Form submission wrapper with field-specific error handling
 */
export function handleFormError(
  error: ApiError,
  setError: (field: string, message: { message: string }) => void
) {
  if (error.field) {
    setError(error.field, { message: error.userMessage });
  } else {
    showErrorToast(error);
  }
}

/**
 * Hook for handling form submissions with database errors
 */
export function useFormErrorHandler() {
  return {
    handleSubmit: async <T>(
      submitFunction: () => Promise<ApiResponse<T>>,
      options: {
        successMessage?: string;
        onSuccess?: (data: T) => void;
        onError?: (error: ApiError) => void;
        setError?: (field: string, message: { message: string }) => void;
      } = {}
    ): Promise<T | null> => {
      const response = await submitFunction();

      if (response.success && response.data) {
        if (options.successMessage) {
          toast.success(options.successMessage);
        }
        if (options.onSuccess) {
          options.onSuccess(response.data);
        }
        return response.data;
      } else if (response.error) {
        if (options.setError && response.error.field) {
          options.setError(response.error.field, { message: response.error.userMessage });
        } else {
          showErrorToast(response.error);
        }
        if (options.onError) {
          options.onError(response.error);
        }
        return null;
      }

      return null;
    },

    showFieldError: (field: string, message: string, setError: (field: string, message: { message: string }) => void) => {
      setError(field, { message });
    }
  };
}

