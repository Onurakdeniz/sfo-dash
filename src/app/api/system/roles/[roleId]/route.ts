import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await db.select()
      .from(roles)
      .where(and(
        eq(roles.id, params.roleId),
        isNull(roles.deletedAt)
      ))
      .limit(1);

    if (role.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(role[0]);
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, displayName, description, sortOrder, metadata } = await request.json();

    if (!name || !displayName) {
      return NextResponse.json(
        { error: "Name and displayName are required" },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await db.select()
      .from(roles)
      .where(and(
        eq(roles.id, params.roleId),
        isNull(roles.deletedAt)
      ))
      .limit(1);

    if (existingRole.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Update role (code, workspaceId, companyId, and isSystem cannot be changed)
    const updatedRole = await db.update(roles)
      .set({
        name,
        displayName,
        description,
        sortOrder,
        metadata,
        updatedAt: new Date()
      })
      .where(eq(roles.id, params.roleId))
      .returning();

    return NextResponse.json(updatedRole[0]);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if role exists and is not a system role
    const existingRole = await db.select()
      .from(roles)
      .where(and(
        eq(roles.id, params.roleId),
        isNull(roles.deletedAt)
      ))
      .limit(1);

    if (existingRole.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existingRole[0].isSystem) {
      return NextResponse.json({ error: "Cannot delete system roles" }, { status: 400 });
    }

    // Soft delete the role
    await db.update(roles)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(roles.id, params.roleId));

    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}