import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { userRoles, roles, workspace, company } from "@/db/schema";
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

    const list = await db.select().from(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.workspaceId, workspaceId),
        companyId ? eq(userRoles.companyId, companyId) : isNull(userRoles.companyId)
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

    const { roleId, workspaceId, companyId } = await request.json();
    if (!roleId || !workspaceId) return NextResponse.json({ error: "roleId and workspaceId required" }, { status: 400 });

    const roleExists = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
    if (roleExists.length === 0) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    const wsExists = await db.select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1);
    if (wsExists.length === 0) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    if (companyId) {
      const comp = await db.select().from(company).where(eq(company.id, companyId)).limit(1);
      if (comp.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { userId } = await params;

    const existing = await db.select().from(userRoles).where(and(
      eq(userRoles.userId, userId),
      eq(userRoles.roleId, roleId),
      eq(userRoles.workspaceId, workspaceId),
      companyId ? eq(userRoles.companyId, companyId) : isNull(userRoles.companyId)
    )).limit(1);
    if (existing.length > 0) return NextResponse.json(existing[0]);

    const inserted = await db.insert(userRoles).values({
      id: randomUUID(),
      userId,
      roleId,
      workspaceId,
      companyId: companyId || null,
      isActive: true,
      assignedBy: session.user.id,
      assignedAt: new Date(),
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
    const roleId = searchParams.get("roleId");
    const workspaceId = searchParams.get("workspaceId");
    const companyId = searchParams.get("companyId");
    if (!roleId || !workspaceId) return NextResponse.json({ error: "roleId and workspaceId required" }, { status: 400 });

    const { userId } = await params;

    await db.delete(userRoles).where(and(
      eq(userRoles.userId, userId),
      eq(userRoles.roleId, roleId),
      eq(userRoles.workspaceId, workspaceId),
      companyId ? eq(userRoles.companyId, companyId) : isNull(userRoles.companyId)
    ));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
