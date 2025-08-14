import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, companyFile, workspaceCompany } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

// List files and create file metadata records after successful Blob uploads
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId } = await params;

    // Access check: user must have workspace access to company's workspace
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");

    const rows = await db
      .select()
      .from(companyFile)
      .where(
        and(
          eq(companyFile.companyId, companyId),
          sql`${companyFile.deletedAt} IS NULL`,
          q ? sql`${companyFile.name} ILIKE ${"%" + q + "%"}` : sql`true`
        )
      )
      .orderBy(desc(companyFile.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error listing company files:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const body = await request.json();
    const { name, blobUrl, blobPath, contentType, size, metadata } = body ?? {};

    if (!name || !blobUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = `cfile_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const [row] = await db
      .insert(companyFile)
      .values({
        id,
        companyId,
        uploadedBy: session.user.id,
        name: String(name),
        blobUrl: String(blobUrl),
        blobPath: blobPath ? String(blobPath) : null,
        contentType: contentType ? String(contentType) : null,
        size: Number(size ?? 0),
        metadata: metadata ?? null,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Error creating company file record:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

