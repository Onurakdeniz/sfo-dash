import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { company, workspace, workspaceCompany } from "@/db/schema";
import { slugifyCompanyFirstWord } from "@/lib/slug";
import { eq } from "drizzle-orm";

export async function POST(
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

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
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
        { error: "Unauthorized to add company to this workspace" },
        { status: 403 }
      );
    }

    // Generate company ID
    const companyId = `company_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create company in database
    const [newCompany] = await db.insert(company).values({
      id: companyId,
      name: name.trim(),
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
    }).returning();

    // Link company to workspace
    await db.insert(workspaceCompany).values({
      workspaceId: workspaceId,
      companyId: companyId,
      addedBy: session.user.id,
    });

    // Generate slug from only the first word transliterated to ASCII
    const slug = slugifyCompanyFirstWord(newCompany.name || '');

    return NextResponse.json({
      id: newCompany.id,
      name: newCompany.fullName || newCompany.name, // Use fullName as display name, fallback to name
      slug: slug, // Generated slug for URL and display
      domain: newCompany.website,
      logoUrl: newCompany.companyLogoUrl,
      industry: newCompany.industry,
      size: null, // Not available in current schema
      isActive: newCompany.status === 'active', // Map status to boolean
      createdAt: newCompany.createdAt,
      updatedAt: newCompany.updatedAt,
      taxNumber: newCompany.taxNumber,
      taxOffice: newCompany.taxOffice,
      employeeCount: null, // Not available in current schema
    });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}