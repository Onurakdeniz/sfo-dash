import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { modules } from "@/db/schema";
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

    const allModules = await db.select()
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

    const { code, name, displayName, description, category, icon, color, isCore, sortOrder, settings, metadata } = await request.json();

    if (!code || !name || !displayName || !category) {
      return NextResponse.json(
        { error: "Code, name, displayName, and category are required" },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['core', 'hr', 'finance', 'inventory', 'crm', 'project', 'document', 'reporting', 'integration', 'security', 'settings'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
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
      isCore: isCore || false,
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