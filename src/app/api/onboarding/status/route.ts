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

    // Check if user has any workspaces (either owned or as member)
    
    // First check if user owns any workspaces
    const ownedWorkspaces = await db.select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    })
    .from(workspace)
    .where(eq(workspace.ownerId, session.user.id))
    .limit(1);

    let hasWorkspace = ownedWorkspaces.length > 0;
    let hasCompany = false;
    let workspaceId: string | undefined;
    let companyId: string | undefined;

    if (hasWorkspace) {
      // User owns a workspace
      workspaceId = ownedWorkspaces[0].id;
      
      // Check if the workspace has any companies
      const workspaceCompanies = await db.select()
        .from(workspaceCompany)
        .where(eq(workspaceCompany.workspaceId, workspaceId))
        .limit(1);
      
      hasCompany = workspaceCompanies.length > 0;
      if (hasCompany) {
        companyId = workspaceCompanies[0].id;
      }
    } else {
      // Check if user is a member of any workspaces
      const memberWorkspaces = await db.select({
        workspaceId: workspaceMember.workspaceId,
        permissions: workspaceMember.permissions,
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
      })
      .from(workspaceMember)
      .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
      .where(eq(workspaceMember.userId, session.user.id))
      .limit(1);

      if (memberWorkspaces.length > 0) {
        hasWorkspace = true;
        workspaceId = memberWorkspaces[0].workspaceId;
        
        // For invited users, try to extract company ID from permissions
        if (memberWorkspaces[0].permissions) {
          try {
            let permissions;
            // Check if permissions is already an object or needs parsing
            if (typeof memberWorkspaces[0].permissions === 'string') {
              permissions = JSON.parse(memberWorkspaces[0].permissions);
            } else {
              permissions = memberWorkspaces[0].permissions;
            }
            
            if (permissions && permissions.restrictedToCompany) {
              companyId = permissions.restrictedToCompany;
              hasCompany = true; // Invited users already have a company assigned
            }
          } catch (e) {
            console.error("Error parsing permissions:", e);
          }
        }
        
        // If no company from permissions, check if the workspace has any companies
        if (!hasCompany) {
          const workspaceCompanies = await db.select()
            .from(workspaceCompany)
            .where(eq(workspaceCompany.workspaceId, workspaceId))
            .limit(1);
          
          hasCompany = workspaceCompanies.length > 0;
          if (hasCompany) {
            companyId = workspaceCompanies[0].id;
          }
        }
      }
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
      companyId: hasCompany ? companyId : undefined,
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