import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, talep as talepTable, talepFile, workspace, workspaceCompany } from "@/db/schema";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { slugifyCompanyFirstWord } from "@/lib/slug";

// List talep files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, talepId } = await params;

    // Resolve workspace by id or slug
    const foundWorkspace = await db
      .select()
      .from(workspace)
      .where(or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug)))
      .limit(1);
    if (foundWorkspace.length === 0) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;
    const companyById = await db
      .select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);
    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      const companiesInWorkspace = await db
        .select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));
      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) resolvedCompanyId = matched.cmp.id;
    }
    if (!resolvedCompanyId) return NextResponse.json({ error: "Company not found in this workspace" }, { status: 404 });

    const [tRow] = await db
      .select({ id: talepTable.id })
      .from(talepTable)
      .where(and(eq(talepTable.id, talepId), eq(talepTable.companyId, resolvedCompanyId), eq(talepTable.workspaceId, resolvedWorkspace.id)))
      .limit(1);
    if (!tRow) return NextResponse.json({ error: "Talep not found" }, { status: 404 });

    const q = request.nextUrl.searchParams.get("q");

    const rows = await db
      .select()
      .from(talepFile)
      .where(
        and(
          eq(talepFile.talepId, talepId),
          sql`${talepFile.deletedAt} IS NULL`,
          q ? sql`(${talepFile.name} ILIKE ${"%" + q + "%"} OR ${talepFile.category} ILIKE ${"%" + q + "%"})` : sql`true`
        )
      )
      .orderBy(desc(talepFile.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error listing talep files:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create talep file (after client uploaded to Blob)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, talepId } = await params;

    // Resolve workspace by id or slug
    const foundWorkspace = await db
      .select()
      .from(workspace)
      .where(or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug)))
      .limit(1);
    if (foundWorkspace.length === 0) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;
    const companyById = await db
      .select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);
    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      const companiesInWorkspace = await db
        .select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));
      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) resolvedCompanyId = matched.cmp.id;
    }
    if (!resolvedCompanyId) return NextResponse.json({ error: "Company not found in this workspace" }, { status: 404 });

    const [tRow] = await db
      .select({ id: talepTable.id })
      .from(talepTable)
      .where(and(eq(talepTable.id, talepId), eq(talepTable.companyId, resolvedCompanyId), eq(talepTable.workspaceId, resolvedWorkspace.id)))
      .limit(1);
    if (!tRow) return NextResponse.json({ error: "Talep not found" }, { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { name, blobUrl, blobPath, contentType, size, metadata, category, description, isVisibleToCustomer } = body as Partial<{
      name: string;
      blobUrl: string;
      blobPath: string | null;
      contentType: string | null;
      size: number | string | null;
      metadata: any;
      category: string | null;
      description: string | null;
      isVisibleToCustomer: boolean;
    }>;

    if (!name || !blobUrl) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const id = `tfile_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const [inserted] = await db
      .insert(talepFile)
      .values({
        id,
        talepId,
        name: String(name),
        category: category ? String(category) : null,
        description: description ? String(description) : null,
        blobUrl: String(blobUrl),
        blobPath: blobPath ? String(blobPath) : null,
        contentType: contentType ? String(contentType) : null,
        size: Number(size ?? 0),
        metadata: metadata ?? null,
        isVisibleToCustomer: Boolean(isVisibleToCustomer ?? false),
        uploadedBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error("Error creating talep file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


