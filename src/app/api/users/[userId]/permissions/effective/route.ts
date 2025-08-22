import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { 
  userRoles, 
  roleModulePermissions, 
  userModulePermissions, 
  modulePermissions, 
  moduleResources, 
  modules 
} from "@/db/schema";

// GET /api/users/:userId/permissions/effective?workspaceId=...&companyId=...&shape=flat|map
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const companyId = searchParams.get("companyId");
    const shape = (searchParams.get("shape") || "flat").toLowerCase();

    if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

    const { userId } = params;

    // 1) Assigned roles for scope
    const roleRows = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(and(
        eq(userRoles.userId, userId),
        eq(userRoles.workspaceId, workspaceId),
        companyId ? eq(userRoles.companyId, companyId) : isNull(userRoles.companyId)
      ));
    const roleIds = roleRows.map((r) => r.roleId);

    // 2) Role-based permissions in this scope
    let rolePermissionRows: Array<any> = [];
    if (roleIds.length > 0) {
      rolePermissionRows = await db
        .select({
          rolePermission: roleModulePermissions,
          permission: modulePermissions,
          resource: moduleResources,
          module: modules,
        })
        .from(roleModulePermissions)
        .leftJoin(modulePermissions, eq(roleModulePermissions.permissionId, modulePermissions.id))
        .leftJoin(moduleResources, eq(modulePermissions.resourceId, moduleResources.id))
        .leftJoin(modules, eq(moduleResources.moduleId, modules.id))
        .where(and(
          inArray(roleModulePermissions.roleId, roleIds),
          eq(roleModulePermissions.workspaceId, workspaceId),
          companyId ? eq(roleModulePermissions.companyId, companyId) : isNull(roleModulePermissions.companyId)
        ));
    }

    // 3) Direct user grants in this scope
    const directRows = await db
      .select({
        direct: userModulePermissions,
        permission: modulePermissions,
        resource: moduleResources,
        module: modules,
      })
      .from(userModulePermissions)
      .leftJoin(modulePermissions, eq(userModulePermissions.permissionId, modulePermissions.id))
      .leftJoin(moduleResources, eq(modulePermissions.resourceId, moduleResources.id))
      .leftJoin(modules, eq(moduleResources.moduleId, modules.id))
      .where(and(
        eq(userModulePermissions.userId, userId),
        eq(userModulePermissions.workspaceId, workspaceId),
        companyId ? eq(userModulePermissions.companyId, companyId) : isNull(userModulePermissions.companyId)
      ));

    // 4) Merge & dedupe
    const byId: Record<string, {
      id: string;
      action: string;
      name: string;
      displayName: string;
      module: string;
      moduleId: string;
      resource: string;
      resourceId: string;
      sources: string[];
    }> = {};

    for (const row of rolePermissionRows) {
      const p = row.permission;
      if (!p?.id) continue;
      const key = p.id as string;
      if (!byId[key]) {
        byId[key] = {
          id: key,
          action: p.action,
          name: p.name,
          displayName: p.displayName,
          module: row.module?.displayName ?? row.module?.name ?? "",
          moduleId: row.module?.id ?? "",
          resource: row.resource?.displayName ?? row.resource?.name ?? "",
          resourceId: row.resource?.id ?? "",
          sources: [],
        };
      }
      if (!byId[key].sources.includes("Role")) byId[key].sources.push("Role");
    }

    for (const row of directRows) {
      const p = row.permission;
      if (!p?.id) continue;
      const key = p.id as string;
      if (!byId[key]) {
        byId[key] = {
          id: key,
          action: p.action,
          name: p.name,
          displayName: p.displayName,
          module: row.module?.displayName ?? row.module?.name ?? "",
          moduleId: row.module?.id ?? "",
          resource: row.resource?.displayName ?? row.resource?.name ?? "",
          resourceId: row.resource?.id ?? "",
          sources: [],
        };
      }
      if (!byId[key].sources.includes("Direct")) byId[key].sources.push("Direct");
    }

    const flat = Object.values(byId).sort((a, b) => (a.module + a.resource + a.action).localeCompare(b.module + b.resource + b.action));

    if (shape === "map") {
      const map: Record<string, boolean> = {};
      for (const p of flat) {
        map[p.name] = true;
      }
      return NextResponse.json({ permissions: map });
    }

    return NextResponse.json(flat);
  } catch (error) {
    console.error("Error computing effective permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


