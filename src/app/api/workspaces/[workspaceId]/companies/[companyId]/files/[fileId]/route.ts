import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, companyFile, workspaceCompany } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { del } from "@vercel/blob";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, fileId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const [row] = await db
      .select()
      .from(companyFile)
      .where(and(eq(companyFile.id, fileId), eq(companyFile.companyId, companyId), sql`${companyFile.deletedAt} IS NULL`))
      .limit(1);
    if (!row) return NextResponse.json({ error: "File not found" }, { status: 404 });

    return NextResponse.json(row);
  } catch (error) {
    console.error("Error fetching company file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, fileId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const [existing] = await db
      .select()
      .from(companyFile)
      .where(and(eq(companyFile.id, fileId), eq(companyFile.companyId, companyId), sql`${companyFile.deletedAt} IS NULL`))
      .limit(1);
    if (!existing) return NextResponse.json({ error: "File not found" }, { status: 404 });

    await db
      .update(companyFile)
      .set({ deletedAt: new Date() })
      .where(eq(companyFile.id, fileId));

    // Try to delete from Blob storage if we have a known path or URL
    try {
      if (existing.blobPath) {
        await del(existing.blobPath);
      } else if (existing.blobUrl) {
        await del(existing.blobUrl);
      }
    } catch (e) {
      console.warn("Blob deletion failed (ignored):", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

