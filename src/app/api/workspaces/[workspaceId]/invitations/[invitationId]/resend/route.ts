import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceMember, invitation } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; invitationId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, invitationId } = await params;

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
        { error: "Insufficient permissions to resend invitations" },
        { status: 403 }
      );
    }

    // Find the invitation
    const invitationResult = await db.select()
      .from(invitation)
      .where(
        and(
          eq(invitation.id, invitationId),
          eq(invitation.workspaceId, workspaceId),
          eq(invitation.status, 'pending')
        )
      )
      .limit(1);

    if (invitationResult.length === 0) {
      return NextResponse.json(
        { error: "Invitation not found or not pending" },
        { status: 404 }
      );
    }

    const invitationData = invitationResult[0];
    
    // Check if invitation is expired
    if (new Date() > new Date(invitationData.expiresAt)) {
      return NextResponse.json(
        { error: "Invitation has expired. Please create a new invitation." },
        { status: 400 }
      );
    }

    // Resend invitation email
    try {
      const workspaceData = workspaceResult[0];
      const inviteUrl = `http://localhost:3000/invite/${invitationData.token}`;
      
      console.log("🔄 Resending invitation email:");
      console.log("- To email:", invitationData.email);
      console.log("- Workspace:", workspaceData.name);
      console.log("- Invite URL:", inviteUrl);
      console.log("- Token:", invitationData.token);
      console.log("- Invitation ID:", invitationData.id);
      console.log("- Status:", invitationData.status);
      console.log("- Expires at:", invitationData.expiresAt);
      
      await resend.emails.send({
        from: "noreply@transactions.weddingneonsign.com",
        to: invitationData.email,
        subject: `${workspaceData.name} çalışma alanına davetiye (Yeniden Gönderildi)`,
        tracking: {
          click: false,
          open: false
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Çalışma Alanı Davetiyesi</h1>
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #007cba; margin-bottom: 15px;">Merhaba!</h2>
              <p style="line-height: 1.6; color: #555;">
                <strong>${workspaceData.name}</strong> çalışma alanına katılmak için davet edildiniz.
              </p>
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 10px; margin: 15px 0;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  📧 Bu davetiye yeniden gönderilmiştir.
                </p>
              </div>
              ${invitationData.message ? `<p style="line-height: 1.6; color: #555; font-style: italic; border-left: 3px solid #007cba; padding-left: 15px; margin: 15px 0;">"${invitationData.message}"</p>` : ''}
              <p style="line-height: 1.6; color: #555;">
                Davetiyenizi kabul etmek ve hesap oluşturmak için aşağıdaki bağlantıya tıklayın:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="background-color: #007cba; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Davetiyeyi Kabul Et
                </a>
              </div>
              <p style="color: #888; font-size: 14px; line-height: 1.6;">
                Bu davetiye <strong>${new Date(invitationData.expiresAt).toLocaleDateString()}</strong> tarihine kadar geçerlidir.
              </p>
            </div>
            <div style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
              <p>Bu e-posta LunaManager tarafından gönderilmiştir.</p>
            </div>
          </div>
        `,
      });
      
      console.log("✅ Invitation email resent successfully");
      
      return NextResponse.json({
        message: "Invitation resent successfully",
        sentTo: invitationData.email,
      });

    } catch (emailError) {
      console.error("❌ Failed to resend invitation email:", emailError);
      return NextResponse.json(
        { error: "Failed to resend invitation email" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}