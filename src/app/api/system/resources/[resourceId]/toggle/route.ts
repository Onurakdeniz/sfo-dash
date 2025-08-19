import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { moduleResources, companyModuleResources } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

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

    const { isActive, companyId } = await request.json();

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

    // If toggling globally (no company scope), update module_resources table
    if (!companyId) {
      const updatedResource = await db.update(moduleResources)
        .set({
          isActive,
          updatedAt: new Date()
        })
        .where(eq(moduleResources.id, params.resourceId))
        .returning();
      return NextResponse.json(updatedResource[0]);
    }

    // Company-scoped toggle: upsert into company_module_resources
    const existing = await db
      .select()
      .from(companyModuleResources)
      .where(and(eq(companyModuleResources.companyId, companyId), eq(companyModuleResources.resourceId, params.resourceId)))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(companyModuleResources)
        .set({ isEnabled: isActive, toggledBy: session.user.id, toggledAt: new Date(), updatedAt: new Date() })
        .where(eq(companyModuleResources.id, existing[0].id))
        .returning();
      return NextResponse.json(updated[0]);
    }

    const inserted = await db
      .insert(companyModuleResources)
      .values({
        id: randomUUID(),
        companyId,
        resourceId: params.resourceId,
        isEnabled: isActive,
        toggledBy: session.user.id,
        toggledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error("Error toggling resource status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}