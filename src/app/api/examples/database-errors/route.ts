/**
 * Example API Route - Database Error Handling
 *
 * This route demonstrates how to handle database constraint violations
 * and return user-friendly error messages to the frontend.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { DatabaseErrorHandler, withDatabaseErrorHandling } from "@/lib/database-errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, username } = body;

    // Example 1: Direct database operation with error handling
    const result = await withDatabaseErrorHandling(async () => {
      return await db.insert(user).values({
        name,
        email,
        username,
        emailVerified: false,
        role: "member" as const,
      }).returning();
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "User created successfully"
    });

  } catch (error) {
    console.error("Database operation failed:", error);

    // Example 2: Manual error parsing
    const parsedError = DatabaseErrorHandler.parseError(error);

    if (parsedError) {
      return NextResponse.json(
        { success: false, error: parsedError },
        { status: 400 }
      );
    }

    // Fallback for unknown errors
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          userMessage: "Something went wrong. Please try again."
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Example with different error scenarios
 */
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testCase = searchParams.get('test');

  try {
    switch (testCase) {
      case 'invalid-email':
        await db.insert(user).values({
          name: "Test User",
          email: "invalid-email", // This will trigger email validation constraint
          emailVerified: false,
          role: "member" as const,
        });
        break;

      case 'duplicate-email':
        await db.insert(user).values({
          name: "Test User 2",
          email: "existing@example.com", // Assuming this email exists
          emailVerified: false,
          role: "member" as const,
        });
        break;

      case 'invalid-phone':
        // If you had a phone validation constraint, this would trigger it
        await db.insert(user).values({
          name: "Test User",
          email: "test@example.com",
          emailVerified: false,
          role: "member" as const,
        });
        break;

      default:
        return NextResponse.json({ success: true, message: "Test completed" });
    }

    return NextResponse.json({ success: true, message: "Test completed" });

  } catch (error) {
    const parsedError = DatabaseErrorHandler.parseError(error);
    return NextResponse.json(
      { success: false, error: parsedError },
      { status: 400 }
    );
  }
}

