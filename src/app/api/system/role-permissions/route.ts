import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { roleModulePermissions, roles, modulePermissions, moduleResources, modules, workspace, company } from "@/db/schema";
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
    const roleId = searchParams.get('roleId');
    const workspaceId = searchParams.get('workspaceId');
    const companyId = searchParams.get('companyId');

    let whereCondition = and();

    if (roleId) {
      whereCondition = and(whereCondition, eq(roleModulePermissions.roleId, roleId));
    }

    if (workspaceId) whereCondition = and(whereCondition, eq(roleModulePermissions.workspaceId, workspaceId));
    if (companyId) whereCondition = and(whereCondition, eq(roleModulePermissions.companyId, companyId));

    const rolePermissions = await db.select({
      rolePermission: roleModulePermissions,
      role: roles,
      permission: modulePermissions,
      resource: moduleResources,
      module: modules
    })
    .from(roleModulePermissions)
    .leftJoin(roles, eq(roleModulePermissions.roleId, roles.id))
    .leftJoin(modulePermissions, eq(roleModulePermissions.permissionId, modulePermissions.id))
    .leftJoin(moduleResources, eq(modulePermissions.resourceId, moduleResources.id))
    .leftJoin(modules, eq(moduleResources.moduleId, modules.id))
    .where(whereCondition)
    .orderBy(roles.name, modules.name, moduleResources.name);

    return NextResponse.json(rolePermissions);
  } catch (error) {
    console.error("Error fetching role permissions:", error);
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

    const { roleId, permissionId, workspaceId, companyId, isGranted, expiresAt, conditions } = await request.json();

    if (!roleId || !permissionId || !workspaceId) {
      return NextResponse.json(
        { error: "RoleId, permissionId, and workspaceId are required" },
        { status: 400 }
      );
    }

    // Check if role exists
    const roleExists = await db.select()
      .from(roles)
      .where(and(eq(roles.id, roleId), isNull(roles.deletedAt)))
      .limit(1);

    if (roleExists.length === 0) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Check if permission exists
    const permissionExists = await db.select()
      .from(modulePermissions)
      .where(eq(modulePermissions.id, permissionId))
      .limit(1);

    if (permissionExists.length === 0) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    // Check if workspace exists
    const workspaceExists = await db.select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);
    // If company provided, check it exists
    if (companyId) {
      const companyExists = await db
        .select()
        .from(company)
        .where(eq(company.id, companyId))
        .limit(1);
      if (companyExists.length === 0) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }
    }


    if (workspaceExists.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if permission assignment already exists
    const existingAssignment = await db.select()
      .from(roleModulePermissions)
      .where(and(
        eq(roleModulePermissions.roleId, roleId),
        eq(roleModulePermissions.permissionId, permissionId),
        eq(roleModulePermissions.workspaceId, workspaceId),
        companyId ? eq(roleModulePermissions.companyId, companyId) : isNull(roleModulePermissions.companyId)
      ))
      .limit(1);

    if (existingAssignment.length > 0) {
      // Update existing assignment
      const updatedAssignment = await db.update(roleModulePermissions)
        .set({
          isGranted: isGranted !== undefined ? isGranted : true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          conditions,
          updatedAt: new Date(),
        })
        .where(eq(roleModulePermissions.id, existingAssignment[0].id))
        .returning();

      return NextResponse.json(updatedAssignment[0]);
    } else {
      // Create new assignment
      const newAssignment = await db.insert(roleModulePermissions).values({
        id: randomUUID(),
        roleId,
        permissionId,
        workspaceId,
        companyId: companyId || null,
        isGranted: isGranted !== undefined ? isGranted : true,
        grantedBy: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        conditions,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      return NextResponse.json(newAssignment[0], { status: 201 });
    }
  } catch (error) {
    console.error("Error managing role permission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}