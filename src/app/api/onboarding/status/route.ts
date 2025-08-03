import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For now, return a simple status that indicates onboarding is not complete
    // This can be enhanced later with actual workspace/company checks
    const status = {
      isComplete: false,
      hasWorkspace: false,
      hasCompany: false,
      currentStep: 'workspace' as const,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}