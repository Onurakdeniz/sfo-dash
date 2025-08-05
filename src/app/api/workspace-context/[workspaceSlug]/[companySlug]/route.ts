import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company, workspaceMember } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string; companySlug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceSlug, companySlug } = await params;

    // Get workspace by slug and verify user access
    const [workspaceData] = await db.select()
      .from(workspace)
      .where(eq(workspace.slug, workspaceSlug))
      .limit(1);

    if (!workspaceData) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner or a member of this workspace
    const isOwner = workspaceData.ownerId === session.user.id;
    let userRole = 'owner';
    let userPermissions = null;
    
    if (!isOwner) {
      const membershipCheck = await db.select({
        role: workspaceMember.role,
        permissions: workspaceMember.permissions,
      })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, workspaceData.id),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Access denied - not a member of this workspace" },
          { status: 403 }
        );
      }
      
      userRole = membershipCheck[0].role;
      userPermissions = membershipCheck[0].permissions;
    }

    // Get companies based on user permissions
    let companiesData;
    let restrictedCompanyId = null;

    // Check if user has restrictedToCompany permission
    if (!isOwner && userPermissions) {
      try {
        let permissions;
        if (typeof userPermissions === 'string') {
          permissions = JSON.parse(userPermissions);
        } else {
          permissions = userPermissions;
        }
        
        if (permissions && permissions.restrictedToCompany) {
          restrictedCompanyId = permissions.restrictedToCompany;
        }
      } catch (e) {
        console.error("Error parsing user permissions:", e);
      }
    }

    if (restrictedCompanyId) {
      // User is restricted to a specific company - only fetch that company
      companiesData = await db.select({
        company: company,
        workspaceCompany: workspaceCompany,
      })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceData.id),
          eq(company.id, restrictedCompanyId)
        )
      );
    } else {
      // Owner or admin - fetch all companies in workspace
      companiesData = await db.select({
        company: company,
        workspaceCompany: workspaceCompany,
      })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(eq(workspaceCompany.workspaceId, workspaceData.id));
    }

    // Add slug to companies and find the current company
    const companies = companiesData.map((c) => ({
      id: c.company.id,
      name: c.company.name,
      fullName: c.company.fullName,
      slug: (c.company.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));

    const currentCompany = companies.find(c => c.slug === companySlug);

    // If user is restricted to a specific company and the requested slug doesn't match,
    // return a redirect hint instead of an error
    if (!currentCompany) {
      if (restrictedCompanyId && companies.length === 1) {
        const correctCompany = companies[0];
        return NextResponse.json({
          redirectTo: correctCompany.slug,
          workspace: {
            id: workspaceData.id,
            name: workspaceData.name,
            slug: workspaceData.slug,
          },
          currentCompany: correctCompany,
          companies,
          user: {
            role: userRole,
            permissions: userPermissions,
            isOwner: isOwner,
          },
        });
      }

      return NextResponse.json(
        { error: "Company not found in workspace" },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      workspace: {
        id: workspaceData.id,
        name: workspaceData.name,
        slug: workspaceData.slug,
      },
      currentCompany,
      companies,
      user: {
        role: userRole,
        permissions: userPermissions,
        isOwner: isOwner,
      },
    });

    // Add cache headers for better performance (5 minutes cache)
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error("Error fetching workspace context:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}