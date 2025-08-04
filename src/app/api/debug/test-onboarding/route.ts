import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

// Debug endpoint to test onboarding flow
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Test each endpoint
    const tests = {
      user: session.user,
      endpoints: {
        status: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/onboarding/status`,
        workspace: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/onboarding/workspace`,
        company: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/onboarding/workspace/{workspaceId}/company`,
        complete: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/onboarding/complete`,
        cleanup: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/debug/cleanup`,
      },
      instructions: {
        step1: "Check current status: GET /api/onboarding/status",
        step2: "Create workspace: POST /api/onboarding/workspace",
        step3: "Create company: POST /api/onboarding/workspace/{workspaceId}/company",
        step4: "Check completion: GET /api/onboarding/complete",
        step5: "Clean up (development only): DELETE /api/debug/cleanup",
      },
      examplePayloads: {
        workspace: {
          name: "Test Workspace",
          slug: "test-workspace",
          description: "A test workspace",
          settings: {
            timezone: "Europe/Istanbul",
            language: "tr",
            theme: "light"
          }
        },
        company: {
          name: "Test Company",
          fullName: "Test Company Ltd. Şti.",
          companyType: "limited_sirket",
          industry: "Technology",
          employeesCount: "11-50",
          phone: "+90 555 123 4567",
          email: "info@testcompany.com",
          website: "https://www.testcompany.com",
          address: "Test Mahallesi, Test Sokak No: 123",
          district: "Beşiktaş",
          city: "İstanbul",
          postalCode: "34000",
          taxOffice: "Beşiktaş Vergi Dairesi",
          taxNumber: "1234567890",
          mersisNumber: "0123456789012345",
          notes: "Test notes"
        }
      }
    };

    return NextResponse.json(tests, { status: 200 });
  } catch (error) {
    console.error("Error in test endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}