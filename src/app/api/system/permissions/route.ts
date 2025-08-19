import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modulePermissions, moduleResources, modules } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get('resourceId');

    const conditions: any[] = [];
    
    if (resourceId) {
      conditions.push(eq(modulePermissions.resourceId, resourceId));
    }

    const permissionsWithRelations = await db.select({
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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(modulePermissions.action, modulePermissions.name);

    return NextResponse.json(permissionsWithRelations);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      resourceId, 
      action, 
      name, 
      displayName, 
      description, 
      conditions 
    } = await request.json();

    if (!resourceId || !action || !name || !displayName) {
      return NextResponse.json(
        { error: "ResourceId, action, name, and displayName are required" },
        { status: 400 }
      );
    }

    // Restrict actions to the allowed set
    const allowedActions = ['view', 'edit', 'manage', 'approve'];
    if (!allowedActions.includes(action)) {
      return NextResponse.json(
        { error: `Action must be one of: ${allowedActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if resource exists
    const resourceExists = await db.select()
      .from(moduleResources)
      .where(and(eq(moduleResources.id, resourceId), isNull(moduleResources.deletedAt)))
      .limit(1);

    if (resourceExists.length === 0) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 }
      );
    }

    // Check if permission already exists for this resource and action
    const existingPermission = await db.select()
      .from(modulePermissions)
      .where(and(
        eq(modulePermissions.resourceId, resourceId),
        eq(modulePermissions.action, action)
      ))
      .limit(1);

    if (existingPermission.length > 0) {
      return NextResponse.json(
        { error: "Permission with this action already exists for this resource" },
        { status: 400 }
      );
    }

    const newPermission = await db.insert(modulePermissions).values({
      id: randomUUID(),
      resourceId,
      action,
      name,
      displayName,
      description,
      conditions,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newPermission[0], { status: 201 });
  } catch (error) {
    console.error("Error creating permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}