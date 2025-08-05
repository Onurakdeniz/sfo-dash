import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { moduleResources } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function PATCH(
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

    const { isActive } = await request.json();

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean value" },
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

    // Update resource status
    const updatedResource = await db.update(moduleResources)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(moduleResources.id, params.resourceId))
      .returning();

    return NextResponse.json(updatedResource[0]);
  } catch (error) {
    console.error("Error toggling resource status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}