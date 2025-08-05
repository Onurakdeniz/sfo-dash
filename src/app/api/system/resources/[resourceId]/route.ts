import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { moduleResources, modules } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resource = await db.select({
      id: moduleResources.id,
      moduleId: moduleResources.moduleId,
      code: moduleResources.code,
      name: moduleResources.name,
      displayName: moduleResources.displayName,
      description: moduleResources.description,
      resourceType: moduleResources.resourceType,
      path: moduleResources.path,
      parentResourceId: moduleResources.parentResourceId,
      isActive: moduleResources.isActive,
      isPublic: moduleResources.isPublic,
      requiresApproval: moduleResources.requiresApproval,
      sortOrder: moduleResources.sortOrder,
      metadata: moduleResources.metadata,
      createdAt: moduleResources.createdAt,
      updatedAt: moduleResources.updatedAt,
      module: {
        id: modules.id,
        code: modules.code,
        name: modules.name,
        displayName: modules.displayName
      }
    })
    .from(moduleResources)
    .leftJoin(modules, eq(moduleResources.moduleId, modules.id))
    .where(and(
      eq(moduleResources.id, params.resourceId),
      isNull(moduleResources.deletedAt)
    ))
    .limit(1);

    if (resource.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json(resource[0]);
  } catch (error) {
    console.error("Error fetching resource:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      moduleId, 
      name, 
      displayName, 
      description, 
      resourceType, 
      path, 
      parentResourceId, 
      isActive,
      isPublic, 
      requiresApproval, 
      sortOrder, 
      metadata 
    } = await request.json();

    if (!moduleId || !name || !displayName || !resourceType) {
      return NextResponse.json(
        { error: "ModuleId, name, displayName, and resourceType are required" },
        { status: 400 }
      );
    }

    // Check if resource exists
    const existingResource = await db.select()
      .from(moduleResources)
      .where(and(
        eq(moduleResources.id, params.resourceId),
        isNull(moduleResources.deletedAt)
      ))
      .limit(1);

    if (existingResource.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Update resource
    const updatedResource = await db.update(moduleResources)
      .set({
        moduleId,
        name,
        displayName,
        description,
        resourceType,
        path,
        parentResourceId,
        isActive: isActive ?? existingResource[0].isActive,
        isPublic,
        requiresApproval,
        sortOrder,
        metadata,
        updatedAt: new Date()
      })
      .where(eq(moduleResources.id, params.resourceId))
      .returning();

    return NextResponse.json(updatedResource[0]);
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { resourceId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if resource exists
    const existingResource = await db.select()
      .from(moduleResources)
      .where(and(
        eq(moduleResources.id, params.resourceId),
        isNull(moduleResources.deletedAt)
      ))
      .limit(1);

    if (existingResource.length === 0) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Soft delete the resource
    await db.update(moduleResources)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(moduleResources.id, params.resourceId));

    return NextResponse.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}