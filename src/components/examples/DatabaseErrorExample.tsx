/**
 * Example Component - Database Error Handling with Sonner
 *
 * This component demonstrates how to handle database constraint violations
 * and show user-friendly notifications using sonner.
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { handleApiResponse, showErrorToast, useFormErrorHandler } from "@/lib/api-error-handler";
import { toast } from "sonner";

// Add test API call function
async function testCompanyUpdate(workspaceId: string, companyId: string, data: any, testCase: string = 'normal') {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test different constraint violation scenarios
  switch (testCase) {
    case 'invalid-email':
      return {
        success: false,
        error: {
          code: 'INVALID_EMAIL_FORMAT',
          message: 'Email format is invalid',
          userMessage: 'Please enter a valid email address',
          field: 'email'
        }
      };

    case 'invalid-tax-number':
      return {
        success: false,
        error: {
          code: 'INVALID_TAX_NUMBER',
          message: 'Tax number format is invalid',
          userMessage: 'Turkish tax number must be exactly 10 digits',
          field: 'taxNumber'
        }
      };

    case 'invalid-phone':
      return {
        success: false,
        error: {
          code: 'INVALID_PHONE_FORMAT',
          message: 'Phone format is invalid',
          userMessage: 'Please enter a valid phone number (e.g., +90 555 123 4567)',
          field: 'phone'
        }
      };

    case 'duplicate-tax-number':
      return {
        success: false,
        error: {
          code: 'TAX_NUMBER_EXISTS',
          message: 'Tax number already exists',
          userMessage: 'This tax number is already registered to another company',
          field: 'taxNumber'
        }
      };

    default:
      return {
        success: true,
        data: {
          id: companyId,
          ...data,
          updatedAt: new Date().toISOString()
        }
      };
  }
}

// Form validation schema
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and dashes"),
});

type UserFormData = z.infer<typeof userSchema>;

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    userMessage: string;
    field?: string;
  };
}

export function DatabaseErrorExample() {
  const [isLoading, setIsLoading] = useState(false);
  const { handleSubmit } = useFormErrorHandler();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
    },
  });

  // Example 1: Using the form error handler
  const onSubmitWithFormHandler = async (data: UserFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call - replace with your actual API call
      const response = await mockApiCall(data, 'normal');

      await handleSubmit(
        async () => response,
        {
          successMessage: "User created successfully!",
          onSuccess: (data) => {
            console.log("User created:", data);
            form.reset();
          },
          setError: form.setError,
        }
      );
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Example 2: Manual error handling
  const onSubmitManual = async (data: UserFormData) => {
    setIsLoading(true);

    try {
      // Simulate API call that returns constraint violation
      const response = await mockApiCall(data, 'duplicate-email');

      const result = handleApiResponse(response, {
        successMessage: "User created successfully!",
        showSuccessToast: true,
        onSuccess: (data) => {
          console.log("User created:", data);
          form.reset();
        },
      });

      if (!result) {
        // Error was already handled by handleApiResponse
        return;
      }
    } catch (error) {
      console.error("Manual submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Example 3: Testing different error types
  const testErrorType = async (errorType: string) => {
    const response = await mockApiCall({
      name: "Test User",
      email: "test@example.com",
      username: "testuser"
    }, errorType);

    handleApiResponse(response);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Error Handling Examples</CardTitle>
          <CardDescription>
            This component demonstrates how database constraint violations are handled
            and displayed as user-friendly notifications using sonner.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form Example */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Form Submission Example</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitWithFormHandler)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create User"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Error Type Testing */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test Different Error Types</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => testErrorType('invalid-email')}>
                Test Invalid Email
              </Button>
              <Button variant="outline" onClick={() => testErrorType('duplicate-email')}>
                Test Duplicate Email
              </Button>
              <Button variant="outline" onClick={() => testErrorType('invalid-phone')}>
                Test Invalid Phone
              </Button>
              <Button variant="outline" onClick={() => testErrorType('invalid-tax-number')}>
                Test Invalid Tax Number
              </Button>
              <Button variant="outline" onClick={() => testErrorType('duplicate-tax-number')}>
                Test Duplicate Tax Number
              </Button>
              <Button variant="outline" onClick={() => testErrorType('invalid-website')}>
                Test Invalid Website
              </Button>
            </div>
          </div>

          {/* Company Update Testing */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Test Company Update Errors</h3>
            <p className="text-sm text-muted-foreground mb-3">
              These tests simulate company update operations with constraint violations.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={async () => {
                const result = await testCompanyUpdate('workspace1', 'company1', {
                  name: 'Test Company',
                  email: 'invalid-email',
                  taxNumber: '123456789'
                }, 'invalid-email');
                handleApiResponse(result);
              }}>
                Test Company Invalid Email
              </Button>
              <Button variant="outline" onClick={async () => {
                const result = await testCompanyUpdate('workspace1', 'company1', {
                  name: 'Test Company',
                  taxNumber: '12345' // Too short
                }, 'invalid-tax-number');
                handleApiResponse(result);
              }}>
                Test Company Invalid Tax Number
              </Button>
              <Button variant="outline" onClick={async () => {
                const result = await testCompanyUpdate('workspace1', 'company1', {
                  name: 'Test Company',
                  phone: '123' // Too short
                }, 'invalid-phone');
                handleApiResponse(result);
              }}>
                Test Company Invalid Phone
              </Button>
              <Button variant="outline" onClick={async () => {
                const result = await testCompanyUpdate('workspace1', 'company1', {
                  name: 'Test Company',
                  taxNumber: '1234567890' // Already exists
                }, 'duplicate-tax-number');
                handleApiResponse(result);
              }}>
                Test Company Duplicate Tax Number
              </Button>
            </div>
          </div>

          {/* Manual Error Handling Example */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Manual Error Handling Example</h3>
            <Button onClick={onSubmitManual} disabled={isLoading}>
              Test Manual Error Handling
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mock API function to simulate different error scenarios
async function mockApiCall(data: UserFormData, scenario: string): Promise<ApiResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  switch (scenario) {
    case 'invalid-email':
      return {
        success: false,
        error: {
          code: 'INVALID_EMAIL_FORMAT',
          message: 'Email format is invalid',
          userMessage: 'Please enter a valid email address',
          field: 'email'
        }
      };

    case 'duplicate-email':
      return {
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email already exists',
          userMessage: 'This email address is already registered',
          field: 'email'
        }
      };

    case 'invalid-phone':
      return {
        success: false,
        error: {
          code: 'INVALID_PHONE_FORMAT',
          message: 'Phone format is invalid',
          userMessage: 'Please enter a valid phone number (e.g., +90 555 123 4567)',
          field: 'phone'
        }
      };

    case 'invalid-tax-number':
      return {
        success: false,
        error: {
          code: 'INVALID_TAX_NUMBER',
          message: 'Tax number format is invalid',
          userMessage: 'Turkish tax number must be exactly 10 digits',
          field: 'taxNumber'
        }
      };

    default:
      return {
        success: true,
        data: {
          id: "123",
          ...data,
          createdAt: new Date().toISOString()
        }
      };
  }
}

