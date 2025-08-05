import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company, workspaceMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has completed onboarding - check both owned and member workspaces
    
    // Check owned workspaces
    const ownedWorkspaces = await db.select({
      workspace: workspace,
      companies: workspaceCompany,
    })
    .from(workspace)
    .leftJoin(workspaceCompany, eq(workspace.id, workspaceCompany.workspaceId))
    .where(eq(workspace.ownerId, session.user.id));

    // Check member workspaces
    const memberWorkspaces = await db.select({
      workspace: workspace,
      companies: workspaceCompany,
      permissions: workspaceMember.permissions,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
    .leftJoin(workspaceCompany, eq(workspace.id, workspaceCompany.workspaceId))
    .where(eq(workspaceMember.userId, session.user.id));

    // Combine all workspaces
    const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces];
    
    // Check if user has any workspace with company (either through workspaceCompany or permissions)
    const hasCompletedOnboarding = allWorkspaces.length > 0 && 
      allWorkspaces.some(w => {
        // Has company through workspaceCompany
        if (w.companies !== null) return true;
        
        // Has company through permissions (invited user)
        if (w.permissions) {
          try {
            let permissions;
            // Check if permissions is already an object or needs parsing
            if (typeof w.permissions === 'string') {
              permissions = JSON.parse(w.permissions);
            } else {
              permissions = w.permissions;
            }
            
            return permissions && permissions.restrictedToCompany;
          } catch (e) {
            return false;
          }
        }
        return false;
      });

    if (!hasCompletedOnboarding) {
      return NextResponse.json(
        { error: "Onboarding not complete. Please complete workspace and company setup." },
        { status: 400 }
      );
    }

    // Get the first workspace with a company
    const completedWorkspace = allWorkspaces.find(w => {
      // Has company through workspaceCompany
      if (w.companies !== null) return true;
      
      // Has company through permissions (invited user)
      if (w.permissions) {
        try {
          let permissions;
          // Check if permissions is already an object or needs parsing
          if (typeof w.permissions === 'string') {
            permissions = JSON.parse(w.permissions);
          } else {
            permissions = w.permissions;
          }
          
          return permissions && permissions.restrictedToCompany;
        } catch (e) {
          return false;
        }
      }
      return false;
    });
    
    // Get company details
    let companyDetails = null;
    let companyId = completedWorkspace?.companies?.companyId;
    
    // For invited users, try to get company from permissions
    if (!companyId && completedWorkspace?.permissions) {
      try {
        let permissions;
        // Check if permissions is already an object or needs parsing
        if (typeof completedWorkspace.permissions === 'string') {
          permissions = JSON.parse(completedWorkspace.permissions);
        } else {
          permissions = completedWorkspace.permissions;
        }
        
        if (permissions && permissions.restrictedToCompany) {
          companyId = permissions.restrictedToCompany;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    if (companyId) {
      const [companyRecord] = await db.select()
        .from(company)
        .where(eq(company.id, companyId))
        .limit(1);
      const companyData = companyRecord;
      
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

    // Get detailed onboarding status - check both owned and member workspaces
    
    // First check owned workspaces
    const ownedWorkspaces = await db.select({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      companyId: workspaceCompany.companyId,
    })
    .from(workspace)
    .leftJoin(workspaceCompany, eq(workspace.id, workspaceCompany.workspaceId))
    .where(eq(workspace.ownerId, session.user.id));

    // Then check member workspaces
    const memberWorkspaces = await db.select({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      companyId: workspaceCompany.companyId,
      permissions: workspaceMember.permissions,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
    .leftJoin(workspaceCompany, eq(workspace.id, workspaceCompany.workspaceId))
    .where(eq(workspaceMember.userId, session.user.id));

    // Combine owned and member workspaces
    const allUserWorkspaces = [...ownedWorkspaces, ...memberWorkspaces];

    const workspacesWithCompanies = await Promise.all(
      allUserWorkspaces
        .filter(w => w.companyId !== null || w.permissions)
        .map(async (w) => {
          let companyData = null;
          let companyId = w.companyId;

          // For invited users, try to get company from permissions
          if (!companyId && w.permissions) {
            try {
              let permissions;
              // Check if permissions is already an object or needs parsing
              if (typeof w.permissions === 'string') {
                permissions = JSON.parse(w.permissions);
              } else {
                permissions = w.permissions;
              }
              
              if (permissions && permissions.restrictedToCompany) {
                companyId = permissions.restrictedToCompany;
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }

          if (companyId) {
            const [companyRecord] = await db.select()
              .from(company)
              .where(eq(company.id, companyId))
              .limit(1);
            companyData = companyRecord;
          }
          
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
      totalWorkspaces: allUserWorkspaces.length,
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