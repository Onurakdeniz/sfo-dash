import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company, department, workspaceMember, companyLocation } from "@/db/schema";
import { slugifyCompanyFirstWord } from "@/lib/slug";
import { eq, count, inArray, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // Check if workspace exists and user has access
    const workspaceExists = await db.select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceExists.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const isOwner = workspaceExists[0].ownerId === session.user.id;
    let userRole = 'owner';
    let userPermissions = null;
    let restrictedCompanyId = null;

    if (!isOwner) {
      // Check if user is a member of this workspace
      const membershipCheck = await db.select({
        role: workspaceMember.role,
        permissions: workspaceMember.permissions,
      })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, workspaceId),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Unauthorized to access this workspace" },
          { status: 403 }
        );
      }

      userRole = membershipCheck[0].role;
      userPermissions = membershipCheck[0].permissions;

      // Check if user has company restrictions
      if (userPermissions) {
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
    }

    // Get companies based on user permissions
    let companiesInWorkspace;
    
    if (restrictedCompanyId) {
      // User is restricted to a specific company - only fetch that company
      companiesInWorkspace = await db.select({
        company: company,
      })
      .from(workspaceCompany)
      .leftJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(workspaceCompany.companyId, restrictedCompanyId)
        )
      );
    } else {
      // Owner or unrestricted admin/member - fetch all companies in workspace
      companiesInWorkspace = await db.select({
        company: company,
      })
      .from(workspaceCompany)
      .leftJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(eq(workspaceCompany.workspaceId, workspaceId));
    }

    // Get department counts for each company
    const companyIds = companiesInWorkspace
      .filter(item => item.company !== null)
      .map(item => item.company!.id);

    const departmentCounts = companyIds.length > 0 ? await db.select({
      companyId: department.companyId,
      count: count(),
    })
    .from(department)
    .where(inArray(department.companyId, companyIds))
    .groupBy(department.companyId) : [];

    // Get location counts for each company (soft-delete aware)
    const locationCounts = companyIds.length > 0 ? await db.select({
      companyId: companyLocation.companyId,
      count: count(),
    })
    .from(companyLocation)
    .where(and(inArray(companyLocation.companyId, companyIds), sql`${companyLocation.deletedAt} IS NULL`))
    .groupBy(companyLocation.companyId) : [];

    // Create a map for quick lookup
    const departmentCountMap = new Map(
      departmentCounts.map(item => [item.companyId, item.count])
    );

    const locationCountMap = new Map(
      locationCounts.map(item => [item.companyId, item.count])
    );

    const companies = companiesInWorkspace
      .filter(item => item.company !== null)
      .map(item => {
        const company = item.company!;
        // Generate slug from only the first word transliterated to ASCII
        const slug = slugifyCompanyFirstWord(company.name || '');
        
        return {
          id: company.id,
          name: company.fullName || company.name, // Use fullName as display name, fallback to name
          slug: slug, // Generated slug for URL and display
          domain: company.website,
          logoUrl: company.companyLogoUrl,
          industry: company.industry,
          size: null, // Not available in current schema
          isActive: company.status === 'active', // Map status to boolean
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          taxNumber: company.taxNumber,
          taxOffice: company.taxOffice,
          employeeCount: null, // Not available in current schema
          departmentCount: departmentCountMap.get(company.id) || 0,
          locationCount: locationCountMap.get(company.id) || 0,
        };
      });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}