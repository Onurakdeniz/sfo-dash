import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceMember, user, invitation } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // Check if workspace exists and user has permission
    const workspaceResult = await db.select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceResult.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const userMembership = await db.select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      )
      .limit(1);

    const isOwner = workspaceResult[0].ownerId === session.user.id;
    const isAdmin = userMembership.length > 0 && userMembership[0].role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions to view invitations" },
        { status: 403 }
      );
    }

    // Fetch invitations for this workspace
    const invitations = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        message: invitation.message,
        invitedAt: invitation.invitedAt,
        expiresAt: invitation.expiresAt,
        respondedAt: invitation.respondedAt,
        inviterName: user.name,
        inviterEmail: user.email,
      })
      .from(invitation)
      .leftJoin(user, eq(invitation.invitedBy, user.id))
      .where(
        and(
          eq(invitation.workspaceId, workspaceId),
          eq(invitation.type, 'workspace')
        )
      )
      .orderBy(desc(invitation.invitedAt));

    return NextResponse.json({ invitations });

  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}