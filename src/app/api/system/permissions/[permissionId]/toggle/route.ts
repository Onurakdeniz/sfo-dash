import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modulePermissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
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

    const { isActive } = await request.json();

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean value" },
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

    // Update permission status
    const updatedPermission = await db.update(modulePermissions)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(modulePermissions.id, params.permissionId))
      .returning();

    return NextResponse.json(updatedPermission[0]);
  } catch (error) {
    console.error("Error toggling permission status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}