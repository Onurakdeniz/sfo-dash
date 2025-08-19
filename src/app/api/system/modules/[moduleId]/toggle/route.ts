import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modules, companyModules } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

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

    const { isActive, companyId } = await request.json();

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

    // If toggling globally (no company scope), update modules table
    if (!companyId) {
      const updatedModule = await db
        .update(modules)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(modules.id, params.moduleId))
        .returning();

      return NextResponse.json(updatedModule[0]);
    }

    // Company-scoped toggle
    // Upsert company_modules row
    const existingCompanyModule = await db
      .select()
      .from(companyModules)
      .where(
        and(
          eq(companyModules.moduleId, params.moduleId),
          eq(companyModules.companyId, companyId)
        )
      )
      .limit(1);

    let row;
    if (existingCompanyModule.length > 0) {
      const updated = await db
        .update(companyModules)
        .set({ isEnabled: isActive, toggledBy: session.user.id, toggledAt: new Date(), updatedAt: new Date() })
        .where(eq(companyModules.id, existingCompanyModule[0].id))
        .returning();
      row = updated[0];
    } else {
      const inserted = await db
        .insert(companyModules)
        .values({
          id: randomUUID(),
          companyId,
          moduleId: params.moduleId,
          isEnabled: isActive,
          toggledBy: session.user.id,
          toggledAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      row = inserted[0];
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("Error toggling module status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}