import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all workspaces where user is owner or member
    const userWorkspaces = await db.select({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      workspaceSettings: workspace.settings,
      workspaceCreatedAt: workspace.createdAt,
      workspaceOwnerId: workspace.ownerId,
    })
    .from(workspace)
    .where(eq(workspace.ownerId, session.user.id));

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