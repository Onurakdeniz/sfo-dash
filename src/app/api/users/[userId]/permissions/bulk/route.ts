import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { userModulePermissions, modulePermissions, workspace, company } from "@/db/schema";
import { randomUUID } from "crypto";
import { and, eq, isNull } from "drizzle-orm";

// PATCH /api/users/:userId/permissions/bulk
// Body: { workspaceId: string; companyId?: string; grants: Array<{ permissionId: string; isGranted: boolean }> }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = params;
    const { workspaceId, companyId, grants } = await request.json();

    if (!workspaceId || !Array.isArray(grants)) {
      return NextResponse.json({ error: "workspaceId and grants[] required" }, { status: 400 });
    }

    // Basic validations
    const wsExists = await db.select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1);
    if (wsExists.length === 0) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    if (companyId) {
      const comp = await db.select().from(company).where(eq(company.id, companyId)).limit(1);
      if (comp.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Validate permission ids exist (optional but safer)
    const permissionIds = Array.from(new Set(grants.map((g: any) => g.permissionId).filter(Boolean)));
    if (permissionIds.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    const existingPerms = await db
      .select({ id: modulePermissions.id })
      .from(modulePermissions)
      .where(eq(modulePermissions.isActive, true));
    const validSet = new Set(existingPerms.map((p) => p.id));
    const invalid = permissionIds.filter((id) => !validSet.has(id));
    if (invalid.length > 0) {
      return NextResponse.json({ error: "Invalid permission ids", invalid }, { status: 400 });
    }

    let updated = 0;
    await db.transaction(async (tx) => {
      for (const grant of grants) {
        const { permissionId, isGranted } = grant as { permissionId: string; isGranted: boolean };
        if (!permissionId) continue;

        const existing = await tx
          .select()
          .from(userModulePermissions)
          .where(and(
            eq(userModulePermissions.userId, userId),
            eq(userModulePermissions.permissionId, permissionId),
            eq(userModulePermissions.workspaceId, workspaceId),
            companyId ? eq(userModulePermissions.companyId, companyId) : isNull(userModulePermissions.companyId)
          ))
          .limit(1);

        if (isGranted) {
          if (existing.length > 0) {
            await tx
              .update(userModulePermissions)
              .set({ isGranted: true, updatedAt: new Date() })
              .where(eq(userModulePermissions.id, existing[0].id));
          } else {
            await tx.insert(userModulePermissions).values({
              id: randomUUID(),
              userId,
              permissionId,
              workspaceId,
              companyId: companyId || null,
              isGranted: true,
              grantedBy: session.user.id,
              grantedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          updated++;
        } else {
          if (existing.length > 0) {
            await tx
              .delete(userModulePermissions)
              .where(eq(userModulePermissions.id, existing[0].id));
            updated++;
          }
        }
      }
    });

    return NextResponse.json({ updated });
  } catch (e) {
    console.error("Error in bulk permissions update:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


