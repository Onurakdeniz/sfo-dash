import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { roles, workspace, company } from "@/db/schema";
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
    const workspaceId = searchParams.get('workspaceId');
    const companyId = searchParams.get('companyId');

    const conditions = [isNull(roles.deletedAt)];
    if (workspaceId) conditions.push(eq(roles.workspaceId, workspaceId));
    if (companyId) conditions.push(eq(roles.companyId, companyId));

    const allRoles = await db
      .select()
      .from(roles)
      .where(and(...conditions))
      .orderBy(roles.sortOrder, roles.name);

    return NextResponse.json(allRoles);
  } catch (error) {
    console.error("Error fetching roles:", error);
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
      code, 
      name, 
      displayName, 
      description, 
      workspaceId, 
      companyId, 
      isSystem, 
      sortOrder, 
      metadata 
    } = await request.json();

    if (!code || !name || !displayName) {
      return NextResponse.json(
        { error: "Code, name, and displayName are required" },
        { status: 400 }
      );
    }

    // Must belong to either workspace or company, not both
    if (!workspaceId && !companyId) {
      return NextResponse.json(
        { error: "Either workspaceId or companyId is required" },
        { status: 400 }
      );
    }

    if (workspaceId && companyId) {
      return NextResponse.json(
        { error: "Role cannot belong to both workspace and company" },
        { status: 400 }
      );
    }

    // Check if workspace or company exists
    if (workspaceId) {
      const workspaceExists = await db.select()
        .from(workspace)
        .where(eq(workspace.id, workspaceId))
        .limit(1);

      if (workspaceExists.length === 0) {
        return NextResponse.json(
          { error: "Workspace not found" },
          { status: 404 }
        );
      }
    }

    if (companyId) {
      const companyExists = await db.select()
        .from(company)
        .where(eq(company.id, companyId))
        .limit(1);

      if (companyExists.length === 0) {
        return NextResponse.json(
          { error: "Company not found" },
          { status: 404 }
        );
      }
    }

    // Check if code already exists in the same scope
    let existingRoleCondition = and(
      eq(roles.code, code),
      isNull(roles.deletedAt)
    );

    if (workspaceId) {
      existingRoleCondition = and(existingRoleCondition, eq(roles.workspaceId, workspaceId));
    }

    if (companyId) {
      existingRoleCondition = and(existingRoleCondition, eq(roles.companyId, companyId));
    }

    const existingRole = await db.select()
      .from(roles)
      .where(existingRoleCondition)
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: "Role with this code already exists in this scope" },
        { status: 400 }
      );
    }

    const newRole = await db.insert(roles).values({
      id: randomUUID(),
      code,
      name,
      displayName,
      description,
      workspaceId,
      companyId,
      isSystem: isSystem || false,
      sortOrder: sortOrder || 0,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(newRole[0], { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}