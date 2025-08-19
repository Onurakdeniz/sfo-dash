import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, employeeFile, workspaceCompany } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { del } from "@vercel/blob";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; employeeId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, employeeId, fileId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const [row] = await db
      .select()
      .from(employeeFile)
      .where(and(eq(employeeFile.id, fileId), eq(employeeFile.workspaceId, workspaceId), eq(employeeFile.companyId, companyId), eq(employeeFile.userId, employeeId)));
    if (!row) return NextResponse.json({ error: "File not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("Error fetching employee file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; employeeId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, employeeId, fileId } = await params;
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { name, category, description, metadata } = body as Partial<{ name: string; category: string | null; description: string | null; metadata: any }>;

    const [existing] = await db
      .select()
      .from(employeeFile)
      .where(and(eq(employeeFile.id, fileId), eq(employeeFile.workspaceId, workspaceId), eq(employeeFile.companyId, companyId), eq(employeeFile.userId, employeeId)))
      .limit(1);
    if (!existing) return NextResponse.json({ error: "File not found" }, { status: 404 });

    const [updated] = await db
      .update(employeeFile)
      .set({
        name: typeof name !== 'undefined' ? String(name) : existing.name,
        category: typeof category !== 'undefined' ? (category === null ? null : String(category)) : existing.category,
        description: typeof description !== 'undefined' ? (description === null ? null : String(description)) : existing.description,
        metadata: typeof metadata !== 'undefined' ? metadata : existing.metadata,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(employeeFile.id, fileId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating employee file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; employeeId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, employeeId, fileId } = await params;

    const [row] = await db
      .select()
      .from(employeeFile)
      .where(and(eq(employeeFile.id, fileId), eq(employeeFile.workspaceId, workspaceId), eq(employeeFile.companyId, companyId), eq(employeeFile.userId, employeeId)))
      .limit(1);
    if (!row) return NextResponse.json({ error: "File not found" }, { status: 404 });

    // Soft delete record
    await db
      .update(employeeFile)
      .set({ deletedAt: new Date(), updatedAt: new Date(), updatedBy: session.user.id })
      .where(eq(employeeFile.id, fileId));

    // Best-effort delete blob if path exists
    try {
      if (row.blobPath) await del(row.blobPath);
    } catch (e) {
      console.warn("Blob delete failed (non-fatal):", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


