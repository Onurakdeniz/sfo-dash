import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company, department } from "@/db/schema";
import { eq, count, inArray } from "drizzle-orm";

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

    if (workspaceExists[0].ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this workspace" },
        { status: 403 }
      );
    }

    // Get all companies in this workspace
    const companiesInWorkspace = await db.select({
      company: company,
    })
    .from(workspaceCompany)
    .leftJoin(company, eq(workspaceCompany.companyId, company.id))
    .where(eq(workspaceCompany.workspaceId, workspaceId));

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

    // Create a map for quick lookup
    const departmentCountMap = new Map(
      departmentCounts.map(item => [item.companyId, item.count])
    );

    const companies = companiesInWorkspace
      .filter(item => item.company !== null)
      .map(item => {
        const company = item.company!;
        // Generate slug from name (lowercase, replace spaces with hyphens, remove special chars)
        const slug = company.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .trim();
        
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