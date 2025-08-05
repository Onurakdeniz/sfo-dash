import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function PATCH(
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

    const { isActive } = await request.json();

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean value" },
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

    // System roles cannot be deactivated
    if (existingRole[0].isSystem && !isActive) {
      return NextResponse.json({ error: "System roles cannot be deactivated" }, { status: 400 });
    }

    // Update role status
    const updatedRole = await db.update(roles)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(eq(roles.id, params.roleId))
      .returning();

    return NextResponse.json(updatedRole[0]);
  } catch (error) {
    console.error("Error toggling role status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}