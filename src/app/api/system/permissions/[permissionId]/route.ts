import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modulePermissions, moduleResources, modules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { permissionId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permission = await db.select({
      id: modulePermissions.id,
      resourceId: modulePermissions.resourceId,
      action: modulePermissions.action,
      name: modulePermissions.name,
      displayName: modulePermissions.displayName,
      description: modulePermissions.description,
      isActive: modulePermissions.isActive,
      conditions: modulePermissions.conditions,
      createdAt: modulePermissions.createdAt,
      updatedAt: modulePermissions.updatedAt,
      resource: {
        id: moduleResources.id,
        moduleId: moduleResources.moduleId,
        code: moduleResources.code,
        name: moduleResources.name,
        displayName: moduleResources.displayName,
        resourceType: moduleResources.resourceType,
        module: {
          id: modules.id,
          code: modules.code,
          name: modules.name,
          displayName: modules.displayName
        }
      }
    })
    .from(modulePermissions)
    .leftJoin(moduleResources, eq(modulePermissions.resourceId, moduleResources.id))
    .leftJoin(modules, eq(moduleResources.moduleId, modules.id))
    .where(eq(modulePermissions.id, params.permissionId))
    .limit(1);

    if (permission.length === 0) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    return NextResponse.json(permission[0]);
  } catch (error) {
    console.error("Error fetching permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { permissionId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, displayName, description, conditions } = await request.json();

    if (!name || !displayName) {
      return NextResponse.json(
        { error: "Name and displayName are required" },
        { status: 400 }
      );
    }

    // Check if permission exists
    const existingPermission = await db.select()
      .from(modulePermissions)
      .where(eq(modulePermissions.id, params.permissionId))
      .limit(1);

    if (existingPermission.length === 0) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    // Update permission (resourceId and action cannot be changed)
    const updatedPermission = await db.update(modulePermissions)
      .set({
        name,
        displayName,
        description,
        conditions,
        updatedAt: new Date()
      })
      .where(eq(modulePermissions.id, params.permissionId))
      .returning();

    return NextResponse.json(updatedPermission[0]);
  } catch (error) {
    console.error("Error updating permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { permissionId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if permission exists
    const existingPermission = await db.select()
      .from(modulePermissions)
      .where(eq(modulePermissions.id, params.permissionId))
      .limit(1);

    if (existingPermission.length === 0) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }

    // Delete the permission
    await db.delete(modulePermissions)
      .where(eq(modulePermissions.id, params.permissionId));

    return NextResponse.json({ message: "Permission deleted successfully" });
  } catch (error) {
    console.error("Error deleting permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}