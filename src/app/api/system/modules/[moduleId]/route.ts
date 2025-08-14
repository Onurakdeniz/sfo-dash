import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modules } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const module = await db.select()
      .from(modules)
      .where(and(
        eq(modules.id, params.moduleId),
        isNull(modules.deletedAt)
      ))
      .limit(1);

    if (module.length === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    return NextResponse.json(module[0]);
  } catch (error) {
    console.error("Error fetching module:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, name, displayName, description, icon, color, isCore, sortOrder, settings, metadata } = await request.json();

    if (!name || !displayName) {
      return NextResponse.json(
        { error: "Name and displayName are required" },
        { status: 400 }
      );
    }

    // Check if module exists
    const existingModule = await db.select()
      .from(modules)
      .where(and(
        eq(modules.id, params.moduleId),
        isNull(modules.deletedAt)
      ))
      .limit(1);

    if (existingModule.length === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Update module
    const updatedModule = await db.update(modules)
      .set({
        name,
        displayName,
        description,
        icon,
        color,
        isCore,
        sortOrder,
        settings,
        metadata,
        updatedAt: new Date()
      })
      .where(eq(modules.id, params.moduleId))
      .returning();

    return NextResponse.json(updatedModule[0]);
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if module exists and is not core
    const existingModule = await db.select()
      .from(modules)
      .where(and(
        eq(modules.id, params.moduleId),
        isNull(modules.deletedAt)
      ))
      .limit(1);

    if (existingModule.length === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    if (existingModule[0].isCore) {
      return NextResponse.json({ error: "Cannot delete core modules" }, { status: 400 });
    }

    // Soft delete the module
    await db.update(modules)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(modules.id, params.moduleId));

    return NextResponse.json({ message: "Module deleted successfully" });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}