import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company, workspaceMember } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get owned workspace IDs
    const owned = await db.select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.ownerId, session.user.id));

    // Get member workspace IDs
    const member = await db.select({ id: workspaceMember.workspaceId })
      .from(workspaceMember)
      .where(eq(workspaceMember.userId, session.user.id));

    const allWorkspaceIds = Array.from(new Set([...
      owned.map(w => w.id),
      ...member.map(m => m.id)
    ]));

    if (allWorkspaceIds.length === 0) {
      return NextResponse.json({ workspaces: [], total: 0 });
    }

    // Load full workspace details for all relevant IDs
    const userWorkspaces = await db.select({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      workspaceSettings: workspace.settings,
      workspaceCreatedAt: workspace.createdAt,
      workspaceOwnerId: workspace.ownerId,
    })
    .from(workspace)
    .where(inArray(workspace.id, allWorkspaceIds));

    const workspacesWithDetails = await Promise.all(
      userWorkspaces.map(async (w) => {
        // Get companies for this workspace
        const companiesInWorkspace = await db.select({
          companyId: workspaceCompany.companyId,
        })
        .from(workspaceCompany)
        .where(eq(workspaceCompany.workspaceId, w.workspaceId));

        return {
          id: w.workspaceId,
          name: w.workspaceName,
          slug: w.workspaceSlug,
          settings: w.workspaceSettings,
          createdAt: w.workspaceCreatedAt,
          ownerId: w.workspaceOwnerId,
          companiesCount: companiesInWorkspace.length,
        };
      })
    );

    return NextResponse.json({
      workspaces: workspacesWithDetails,
      total: workspacesWithDetails.length,
    });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}