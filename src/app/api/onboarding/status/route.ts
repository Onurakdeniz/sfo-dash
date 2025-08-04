import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, workspaceMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has any workspaces where they are the owner
    const userWorkspaces = await db.select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    })
    .from(workspace)
    .where(eq(workspace.ownerId, session.user.id))
    .limit(1);

    const hasWorkspace = userWorkspaces.length > 0;
    let hasCompany = false;
    let workspaceId: string | undefined;

    if (hasWorkspace) {
      workspaceId = userWorkspaces[0].id;
      
      // Check if the workspace has any companies
      const workspaceCompanies = await db.select()
        .from(workspaceCompany)
        .where(eq(workspaceCompany.workspaceId, workspaceId))
        .limit(1);
      
      hasCompany = workspaceCompanies.length > 0;
    }

    const isComplete = hasWorkspace && hasCompany;

    // Determine current step
    let currentStep: 'workspace' | 'workspace-settings' | 'company' | 'complete';
    if (isComplete) {
      currentStep = 'complete';
    } else if (hasWorkspace) {
      currentStep = 'company';
    } else {
      currentStep = 'workspace';
    }

    const status = {
      isComplete,
      hasWorkspace,
      hasCompany,
      currentStep,
      workspaceId: hasWorkspace ? workspaceId : undefined,
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