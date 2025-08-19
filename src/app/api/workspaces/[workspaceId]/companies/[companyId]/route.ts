import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company, workspaceMember, department } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET individual company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId } = await params;

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
            
            // If user is restricted to a specific company, they can only access that company
            if (restrictedCompanyId !== companyId) {
              return NextResponse.json(
                { error: "Access denied - you can only access your assigned company" },
                { status: 403 }
              );
            }
          }
        } catch (e) {
          console.error("Error parsing user permissions:", e);
        }
      }
    }

    // Get company and verify it belongs to the workspace
    const companyInWorkspace = await db.select({
      company: company,
    })
    .from(workspaceCompany)
    .leftJoin(company, eq(workspaceCompany.companyId, company.id))
    .where(
      and(
        eq(workspaceCompany.workspaceId, workspaceId),
        eq(workspaceCompany.companyId, companyId)
      )
    )
    .limit(1);

    if (companyInWorkspace.length === 0 || !companyInWorkspace[0].company) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    const companyData = companyInWorkspace[0].company;

    // Generate slug from name (consistent with other endpoints)
    const slug = companyData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    return NextResponse.json({
      id: companyData.id,
      name: companyData.fullName || companyData.name, // Use fullName as display name, fallback to name
      slug: slug, // Generated slug for URL and display
      domain: companyData.website,
      logoUrl: companyData.companyLogoUrl,
      industry: companyData.industry,
      size: null, // Not available in current schema
      isActive: companyData.status === 'active', // Map status to boolean
      createdAt: companyData.createdAt,
      updatedAt: companyData.updatedAt,
      taxNumber: companyData.taxNumber,
      taxOffice: companyData.taxOffice,
      employeeCount: null, // Not available in current schema
      // Additional fields for detailed view
      companyType: companyData.companyType,
      phone: companyData.phone,
      email: companyData.email,
      address: companyData.address,
      district: companyData.district,
      city: companyData.city,
      postalCode: companyData.postalCode,
      mersisNumber: companyData.mersisNumber,
      notes: companyData.notes,
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH (update) company
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      fullName, 
      companyType,
      industry, 
      phone, 
      email, 
      website, 
      address, 
      district, 
      city, 
      postalCode, 
      taxOffice, 
      taxNumber, 
      mersisNumber, 
      notes 
    } = body;

    const { workspaceId, companyId } = await params;

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
        { error: "Unauthorized to modify this workspace" },
        { status: 403 }
      );
    }

    // Verify company belongs to the workspace
    const companyInWorkspace = await db.select()
      .from(workspaceCompany)
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(workspaceCompany.companyId, companyId)
        )
      )
      .limit(1);

    if (companyInWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    // Update company
    const [updatedCompany] = await db.update(company)
      .set({
        name: name?.trim() || undefined,
        fullName: fullName?.trim() || null,
        companyType: companyType || null,
        industry: industry || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        address: address?.trim() || null,
        district: district?.trim() || null,
        city: city || null,
        postalCode: postalCode?.trim() || null,
        taxOffice: taxOffice?.trim() || null,
        taxNumber: taxNumber?.trim() || null,
        mersisNumber: mersisNumber?.trim() || null,
        notes: notes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(company.id, companyId))
      .returning();

    return NextResponse.json({
      id: updatedCompany.id,
      name: updatedCompany.name,
      fullName: updatedCompany.fullName,
      companyType: updatedCompany.companyType,
      industry: updatedCompany.industry,
      phone: updatedCompany.phone,
      email: updatedCompany.email,
      website: updatedCompany.website,
      address: updatedCompany.address,
      district: updatedCompany.district,
      city: updatedCompany.city,
      postalCode: updatedCompany.postalCode,
      taxOffice: updatedCompany.taxOffice,
      taxNumber: updatedCompany.taxNumber,
      mersisNumber: updatedCompany.mersisNumber,
      notes: updatedCompany.notes,
      createdAt: updatedCompany.createdAt,
      updatedAt: updatedCompany.updatedAt,
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId } = await params;

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
        { error: "Unauthorized to modify this workspace" },
        { status: 403 }
      );
    }

    // Verify company belongs to the workspace
    const companyInWorkspace = await db.select()
      .from(workspaceCompany)
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(workspaceCompany.companyId, companyId)
        )
      )
      .limit(1);

    if (companyInWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    // Prevent deleting a company that still has departments
    const existingDepartments = await db
      .select()
      .from(department)
      .where(
        and(
          eq(department.companyId, companyId),
          sql`${department.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingDepartments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete company with existing departments. Please delete its departments first." },
        { status: 400 }
      );
    }

    // Delete workspace company relationship first
    await db.delete(workspaceCompany)
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(workspaceCompany.companyId, companyId)
        )
      );

    // Delete the company
    await db.delete(company)
      .where(eq(company.id, companyId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}