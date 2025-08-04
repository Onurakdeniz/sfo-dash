import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { moduleResources, modules } from "@/db/schema";
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
    const moduleId = searchParams.get('moduleId');

    let query = db.select({
      resource: moduleResources,
      module: modules
    })
    .from(moduleResources)
    .leftJoin(modules, eq(moduleResources.moduleId, modules.id))
    .where(isNull(moduleResources.deletedAt))
    .orderBy(moduleResources.sortOrder, moduleResources.name);

    if (moduleId) {
      query = query.where(and(eq(moduleResources.moduleId, moduleId), isNull(moduleResources.deletedAt)));
    }

    const resources = await query;

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
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
      moduleId, 
      code, 
      name, 
      displayName, 
      description, 
      resourceType, 
      path, 
      parentResourceId, 
      isPublic, 
      requiresApproval, 
      sortOrder, 
      metadata 
    } = await request.json();

    if (!moduleId || !code || !name || !displayName || !resourceType) {
      return NextResponse.json(
        { error: "ModuleId, code, name, displayName, and resourceType are required" },
        { status: 400 }
      );
    }

    // Validate resource type
    const validTypes = ['page', 'api', 'feature', 'report', 'action', 'widget'];
    if (!validTypes.includes(resourceType)) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }

    // Check if module exists
    const moduleExists = await db.select()
      .from(modules)
      .where(and(eq(modules.id, moduleId), isNull(modules.deletedAt)))
      .limit(1);

    if (moduleExists.length === 0) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    // Check if code already exists for this module
    const existingResource = await db.select()
      .from(moduleResources)
      .where(and(
        eq(moduleResources.moduleId, moduleId),
        eq(moduleResources.code, code),
        isNull(moduleResources.deletedAt)
      ))
      .limit(1);

    if (existingResource.length > 0) {
      return NextResponse.json(
        { error: "Resource with this code already exists in the module" },
        { status: 400 }
      );
    }

    const newResource = await db.insert(moduleResources).values({
      id: randomUUID(),
      moduleId,
      code,
      name,
      displayName,
      description,
      resourceType,
      path,
      parentResourceId,
      isPublic: isPublic || false,
      requiresApproval: requiresApproval || false,
      sortOrder: sortOrder || 0,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newResource[0], { status: 201 });
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}