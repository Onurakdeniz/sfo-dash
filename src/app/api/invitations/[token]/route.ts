import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invitation, workspace, company, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    console.log("🔍 DEBUG: Invitation API called");
    console.log("- Token:", token);

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find pending invitation by token
    const invitationResult = await db
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.token, token),
          eq(invitation.status, 'pending')
        )
      )
      .limit(1);

    console.log("🔍 Pending invitations found:", invitationResult.length);

    if (invitationResult.length === 0) {
      console.log("❌ No pending invitation found");
      
      // Check if invitation exists but with different status
      const anyInvitation = await db
        .select()
        .from(invitation)
        .where(eq(invitation.token, token))
        .limit(1);

      if (anyInvitation.length > 0) {
        const inv = anyInvitation[0];
        console.log("Found invitation with status:", inv.status);
        
        if (inv.status === 'accepted') {
          return NextResponse.json(
            { error: "Bu davetiye zaten kabul edilmiş" },
            { status: 400 }
          );
        } else if (inv.status === 'expired') {
          return NextResponse.json(
            { error: "Bu davetiyenin süresi dolmuş" },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            { error: `Davetiye durumu: ${inv.status}` },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { error: "Bu davetiye mevcut değil. Lütfen yeni bir davetiye isteyin." },
        { status: 404 }
      );
    }

    const invitationData = invitationResult[0];

    console.log("✅ Found invitation:", invitationData.id);

    // Check if invitation is expired
    if (new Date() > new Date(invitationData.expiresAt)) {
      console.log("❌ Invitation is expired");
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Get workspace details if this is a workspace invitation
    let workspaceData = null;
    if (invitationData.workspaceId) {
      try {
        const workspaceResult = await db
          .select({
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
          })
          .from(workspace)
          .where(eq(workspace.id, invitationData.workspaceId))
          .limit(1);

        if (workspaceResult.length > 0) {
          workspaceData = workspaceResult[0];
        }
      } catch (err) {
        console.error("Error fetching workspace:", err);
      }
    }

    // Get company details if this is a company invitation
    let companyData = null;
    if (invitationData.companyId) {
      try {
        const companyResult = await db
          .select({
            id: company.id,
            name: company.name,
          })
          .from(company)
          .where(eq(company.id, invitationData.companyId))
          .limit(1);

        if (companyResult.length > 0) {
          companyData = companyResult[0];
        }
      } catch (err) {
        console.error("Error fetching company:", err);
      }
    }

    // Get inviter details
    let inviterData = null;
    if (invitationData.invitedBy) {
      try {
        const inviterResult = await db
          .select({
            name: user.name,
            email: user.email,
          })
          .from(user)
          .where(eq(user.id, invitationData.invitedBy))
          .limit(1);

        if (inviterResult.length > 0) {
          inviterData = inviterResult[0];
        }
      } catch (err) {
        console.error("Error fetching inviter:", err);
      }
    }

    return NextResponse.json({
      invitation: {
        id: invitationData.id,
        email: invitationData.email,
        type: invitationData.type,
        role: invitationData.role,
        workspaceId: invitationData.workspaceId,
        companyId: invitationData.companyId,
        message: invitationData.message,
        invitedBy: invitationData.invitedBy,
        expiresAt: invitationData.expiresAt,
        workspace: workspaceData,
        company: companyData,
        inviter: inviterData,
      },
    });

  } catch (error) {
    console.error("❌ FULL ERROR in invitation API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}