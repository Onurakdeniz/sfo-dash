import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has completed onboarding
    const userWorkspaces = await db.select({
      workspace: workspace,
      companies: workspaceCompany,
    })
    .from(workspace)
    .leftJoin(workspaceCompany, eq(workspace.id, workspaceCompany.workspaceId))
    .where(eq(workspace.ownerId, session.user.id));

    const hasCompletedOnboarding = userWorkspaces.length > 0 && 
                                   userWorkspaces.some(w => w.companies !== null);

    if (!hasCompletedOnboarding) {
      return NextResponse.json(
        { error: "Onboarding not complete. Please complete workspace and company setup." },
        { status: 400 }
      );
    }

    // Get the first workspace with a company
    const completedWorkspace = userWorkspaces.find(w => w.companies !== null);
    
    // Get company details
    let companyDetails = null;
    if (completedWorkspace?.companies?.companyId) {
      const [companyData] = await db.select()
        .from(company)
        .where(eq(company.id, completedWorkspace.companies.companyId))
        .limit(1);
      
      if (companyData) {
        // Create company slug from name
        const createSlug = (name: string) => {
          return name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim();
        };
        
        companyDetails = {
          id: companyData.id,
          name: companyData.name,
          slug: createSlug(companyData.name) || companyData.id, // Fallback to ID
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      workspaceId: completedWorkspace?.workspace.id,
      workspaceSlug: completedWorkspace?.workspace.slug,
      company: companyDetails,
    });
  } catch (error) {
    console.error("Error checking onboarding completion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check completion status
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get detailed onboarding status
    const userWorkspaces = await db.select({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      companyId: workspaceCompany.companyId,
    })
    .from(workspace)
    .leftJoin(workspaceCompany, eq(workspace.id, workspaceCompany.workspaceId))
    .where(eq(workspace.ownerId, session.user.id));

    const workspacesWithCompanies = await Promise.all(
      userWorkspaces
        .filter(w => w.companyId !== null)
        .map(async (w) => {
          const [companyData] = await db.select()
            .from(company)
            .where(eq(company.id, w.companyId!))
            .limit(1);
          
          return {
            workspace: {
              id: w.workspaceId,
              name: w.workspaceName,
              slug: w.workspaceSlug,
            },
            company: companyData ? {
              id: companyData.id,
              name: companyData.name,
              fullName: companyData.fullName,
              slug: companyData.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single
                .trim(),
            } : null,
          };
        })
    );

    const isComplete = workspacesWithCompanies.length > 0;

    return NextResponse.json({
      isComplete,
      workspaces: workspacesWithCompanies,
      totalWorkspaces: userWorkspaces.length,
      workspacesWithCompanies: workspacesWithCompanies.length,
    });
  } catch (error) {
    console.error("Error getting onboarding details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}