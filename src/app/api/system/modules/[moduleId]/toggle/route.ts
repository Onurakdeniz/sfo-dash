import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modules } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function PATCH(
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

    const { isActive } = await request.json();

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean value" },
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

    // Core modules cannot be deactivated
    if (existingModule[0].isCore && !isActive) {
      return NextResponse.json({ error: "Core modules cannot be deactivated" }, { status: 400 });
    }

    // Update module status
    const updatedModule = await db.update(modules)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(modules.id, params.moduleId))
      .returning();

    return NextResponse.json(updatedModule[0]);
  } catch (error) {
    console.error("Error toggling module status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}