import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, workspaceMember, company } from "@/db/schema";
import { eq } from "drizzle-orm";

// DEBUG ENDPOINT - Remove in production
// This endpoint helps clean up test data during development

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    // Get all workspaces owned by the user
    const userWorkspaces = await db.select()
      .from(workspace)
      .where(eq(workspace.ownerId, session.user.id));

    let deletedWorkspaces = 0;
    let deletedCompanies = 0;
    let deletedMembers = 0;
    let deletedWorkspaceCompanies = 0;

    for (const ws of userWorkspaces) {
      // Get all companies linked to this workspace
      const linkedCompanies = await db.select()
        .from(workspaceCompany)
        .where(eq(workspaceCompany.workspaceId, ws.id));

      // Delete workspace members
      const deletedMembersResult = await db.delete(workspaceMember)
        .where(eq(workspaceMember.workspaceId, ws.id));
      deletedMembers++;

      // Delete workspace companies links
      const deletedWorkspaceCompaniesResult = await db.delete(workspaceCompany)
        .where(eq(workspaceCompany.workspaceId, ws.id));
      deletedWorkspaceCompanies += linkedCompanies.length;

      // Delete the companies themselves
      for (const wc of linkedCompanies) {
        await db.delete(company)
          .where(eq(company.id, wc.companyId));
        deletedCompanies++;
      }

      // Delete the workspace
      await db.delete(workspace)
        .where(eq(workspace.id, ws.id));
      deletedWorkspaces++;
    }

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      deleted: {
        workspaces: deletedWorkspaces,
        companies: deletedCompanies,
        members: deletedMembers,
        workspaceCompanies: deletedWorkspaceCompanies,
      },
    });
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json(
      { error: "Internal server error during cleanup" },
      { status: 500 }
    );
  }
}

// GET endpoint to check what would be deleted
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    // Get all workspaces owned by the user
    const userWorkspaces = await db.select()
      .from(workspace)
      .where(eq(workspace.ownerId, session.user.id));

    const workspaceDetails = await Promise.all(
      userWorkspaces.map(async (ws) => {
        const linkedCompanies = await db.select({
          companyId: workspaceCompany.companyId,
          companyName: company.name,
        })
        .from(workspaceCompany)
        .leftJoin(company, eq(workspaceCompany.companyId, company.id))
        .where(eq(workspaceCompany.workspaceId, ws.id));

        const members = await db.select()
          .from(workspaceMember)
          .where(eq(workspaceMember.workspaceId, ws.id));

        return {
          workspace: {
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            createdAt: ws.createdAt,
          },
          companies: linkedCompanies,
          memberCount: members.length,
        };
      })
    );

    return NextResponse.json({
      userId: session.user.id,
      userEmail: session.user.email,
      workspaces: workspaceDetails,
      summary: {
        totalWorkspaces: workspaceDetails.length,
        totalCompanies: workspaceDetails.reduce((acc, ws) => acc + ws.companies.length, 0),
        totalMembers: workspaceDetails.reduce((acc, ws) => acc + ws.memberCount, 0),
      },
    });
  } catch (error) {
    console.error("Error checking cleanup data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}