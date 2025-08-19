import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { userModulePermissions, modulePermissions, workspace, company } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const companyId = searchParams.get("companyId");

    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const { userId } = await params;

    const list = await db.select().from(userModulePermissions)
      .where(and(
        eq(userModulePermissions.userId, userId),
        eq(userModulePermissions.workspaceId, workspaceId),
        companyId ? eq(userModulePermissions.companyId, companyId) : isNull(userModulePermissions.companyId)
      ));
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { permissionId, workspaceId, companyId, isGranted } = await request.json();
    if (!permissionId || !workspaceId) return NextResponse.json({ error: "permissionId and workspaceId required" }, { status: 400 });

    const permExists = await db.select().from(modulePermissions).where(eq(modulePermissions.id, permissionId)).limit(1);
    if (permExists.length === 0) return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    const wsExists = await db.select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1);
    if (wsExists.length === 0) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    if (companyId) {
      const comp = await db.select().from(company).where(eq(company.id, companyId)).limit(1);
      if (comp.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { userId } = await params;

    const existing = await db.select().from(userModulePermissions).where(and(
      eq(userModulePermissions.userId, userId),
      eq(userModulePermissions.permissionId, permissionId),
      eq(userModulePermissions.workspaceId, workspaceId),
      companyId ? eq(userModulePermissions.companyId, companyId) : isNull(userModulePermissions.companyId)
    )).limit(1);

    if (existing.length > 0) {
      const updated = await db.update(userModulePermissions).set({
        isGranted: isGranted !== undefined ? isGranted : true,
        updatedAt: new Date(),
      }).where(eq(userModulePermissions.id, existing[0].id)).returning();
      return NextResponse.json(updated[0]);
    }

    const inserted = await db.insert(userModulePermissions).values({
      id: randomUUID(),
      userId,
      permissionId,
      workspaceId,
      companyId: companyId || null,
      isGranted: isGranted !== undefined ? isGranted : true,
      grantedBy: session.user.id,
      grantedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get("permissionId");
    const workspaceId = searchParams.get("workspaceId");
    const companyId = searchParams.get("companyId");
    if (!permissionId || !workspaceId) return NextResponse.json({ error: "permissionId and workspaceId required" }, { status: 400 });

    const { userId } = await params;

    await db.delete(userModulePermissions).where(and(
      eq(userModulePermissions.userId, userId),
      eq(userModulePermissions.permissionId, permissionId),
      eq(userModulePermissions.workspaceId, workspaceId),
      companyId ? eq(userModulePermissions.companyId, companyId) : isNull(userModulePermissions.companyId)
    ));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
