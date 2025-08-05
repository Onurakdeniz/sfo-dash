import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invitation } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    console.log("🔍 DEBUG: Direct database lookup for token:", token);

    // Get all invitations with this token
    const allInvitations = await db
      .select()
      .from(invitation)
      .where(eq(invitation.token, token));

    console.log("Found invitations:", allInvitations.length);
    
    if (allInvitations.length > 0) {
      allInvitations.forEach((inv, index) => {
        console.log(`Invitation ${index + 1}:`, {
          id: inv.id,
          email: inv.email,
          status: inv.status,
          type: inv.type,
          workspaceId: inv.workspaceId,
          expiresAt: inv.expiresAt,
          invitedAt: inv.invitedAt,
          token: inv.token.substring(0, 10) + "...",
        });
      });
    }

    return NextResponse.json({
      token: token,
      invitations: allInvitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        type: inv.type,
        workspaceId: inv.workspaceId,
        expiresAt: inv.expiresAt,
        invitedAt: inv.invitedAt,
        isExpired: new Date() > new Date(inv.expiresAt),
        token: inv.token.substring(0, 10) + "...",
      })),
      debug: {
        currentTime: new Date().toISOString(),
        tokenLength: token.length,
        tokenStart: token.substring(0, 10),
      }
    });

  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Debug endpoint error", details: error.message },
      { status: 500 }
    );
  }
}