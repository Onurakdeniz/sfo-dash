import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, customer as customerTable, customerFile, workspaceCompany } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

// List customer files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, customerId } = await params;

    // Ensure workspace-company access and that the customer belongs to this company/workspace
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const [customerRow] = await db
      .select({ id: customerTable.id })
      .from(customerTable)
      .where(and(eq(customerTable.id, customerId), eq(customerTable.companyId, companyId), eq(customerTable.workspaceId, workspaceId)))
      .limit(1);
    if (!customerRow) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const q = request.nextUrl.searchParams.get("q");

    const rows = await db
      .select()
      .from(customerFile)
      .where(
        and(
          eq(customerFile.customerId, customerId),
          sql`${customerFile.deletedAt} IS NULL`,
          q ? sql`(${customerFile.name} ILIKE ${"%" + q + "%"} OR ${customerFile.category} ILIKE ${"%" + q + "%"})` : sql`true`
        )
      )
      .orderBy(desc(customerFile.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error listing customer files:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create customer file (after client uploaded to Blob)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, customerId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const [customerRow] = await db
      .select({ id: customerTable.id })
      .from(customerTable)
      .where(and(eq(customerTable.id, customerId), eq(customerTable.companyId, companyId), eq(customerTable.workspaceId, workspaceId)))
      .limit(1);
    if (!customerRow) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const { name, blobUrl, blobPath, contentType, size, metadata, category, description } = body as Partial<{
      name: string;
      blobUrl: string;
      blobPath: string | null;
      contentType: string | null;
      size: number | string | null;
      metadata: any;
      category: string | null;
      description: string | null;
    }>;

    if (!name || !blobUrl) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const id = `cfile_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const [inserted] = await db
      .insert(customerFile)
      .values({
        id,
        customerId,
        name: String(name),
        category: category ? String(category) : null,
        description: description ? String(description) : null,
        blobUrl: String(blobUrl),
        blobPath: blobPath ? String(blobPath) : null,
        contentType: contentType ? String(contentType) : null,
        size: Number(size ?? 0),
        metadata: metadata ?? null,
        uploadedBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error("Error creating customer file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
