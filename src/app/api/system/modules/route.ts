import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modules, companyModules } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
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
    const companyId = searchParams.get('companyId');

    // If company is provided, include company-specific enablement info
    if (companyId) {
      const rows = await db.select({
        id: modules.id,
        code: modules.code,
        name: modules.name,
        displayName: modules.displayName,
        description: modules.description,
        category: modules.category,
        icon: modules.icon,
        color: modules.color,
        isActive: modules.isActive,
        sortOrder: modules.sortOrder,
        settings: modules.settings,
        metadata: modules.metadata,
        createdAt: modules.createdAt,
        updatedAt: modules.updatedAt,
        deletedAt: modules.deletedAt,
        isEnabledForCompany: sql<boolean>`COALESCE(${companyModules.isEnabled}, ${modules.isActive})`,
        companyModuleSettings: companyModules.settings,
      })
        .from(modules)
        .leftJoin(
          companyModules,
          and(
            eq(companyModules.moduleId, modules.id),
            eq(companyModules.companyId, companyId)
          )
        )
        .where(isNull(modules.deletedAt))
        .orderBy(modules.sortOrder, modules.name);

      return NextResponse.json(rows);
    }

    // Fallback: return global modules list
    const allModules = await db
      .select()
      .from(modules)
      .where(isNull(modules.deletedAt))
      .orderBy(modules.sortOrder, modules.name);

    return NextResponse.json(allModules);
  } catch (error) {
    console.error("Error fetching modules:", error);
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

    const { code, name, displayName, description, category = "system", icon, color, sortOrder, settings, metadata } = await request.json();

    if (!code || !name || !displayName) {
      return NextResponse.json(
        { error: "Code, name and displayName are required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingModule = await db.select()
      .from(modules)
      .where(and(eq(modules.code, code), isNull(modules.deletedAt)))
      .limit(1);

    if (existingModule.length > 0) {
      return NextResponse.json(
        { error: "Module with this code already exists" },
        { status: 400 }
      );
    }

    const newModule = await db.insert(modules).values({
      id: randomUUID(),
      code,
      name,
      displayName,
      description,
      category,
      icon,
      color,
      sortOrder: sortOrder || 0,
      settings,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newModule[0], { status: 201 });
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}