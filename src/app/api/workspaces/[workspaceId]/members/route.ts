import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceMember, user, invitation } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

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

    // Check if workspace exists and user has access
    const workspaceExists = await db.select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceExists.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspaceExists[0].ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this workspace" },
        { status: 403 }
      );
    }

    // Get all members of this workspace
    const membersInWorkspace = await db.select({
      member: workspaceMember,
      user: user,
    })
    .from(workspaceMember)
    .leftJoin(user, eq(workspaceMember.userId, user.id))
    .where(eq(workspaceMember.workspaceId, workspaceId));

    const members = membersInWorkspace
      .filter(item => item.user !== null)
      .map(item => ({
        workspaceId: item.member.workspaceId,
        userId: item.member.userId,
        role: item.member.role,
        joinedAt: item.member.joinedAt,
        user: {
          id: item.user!.id,
          name: item.user!.name,
          email: item.user!.email,
          image: item.user!.image,
        }
      }));

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Invite a new member to workspace
export async function POST(
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
    const { email, role, message } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['member', 'admin', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

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
        { error: "Insufficient permissions to invite members" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const existingMembership = await db.select()
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, workspaceId),
            eq(workspaceMember.userId, existingUser[0].id)
          )
        )
        .limit(1);

      if (existingMembership.length > 0) {
        return NextResponse.json(
          { error: "User is already a member of this workspace" },
          { status: 400 }
        );
      }
    }

    // Check for pending invitation
    const existingInvitation = await db.select()
      .from(invitation)
      .where(
        and(
          eq(invitation.email, email),
          eq(invitation.workspaceId, workspaceId),
          eq(invitation.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return NextResponse.json(
        { error: "An invitation is already pending for this email" },
        { status: 400 }
      );
    }

    // Create invitation
    const invitationId = `invitation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(invitation).values({
      id: invitationId,
      email,
      token,
      type: 'workspace',
      role,
      workspaceId,
      invitedBy: session.user.id,
      expiresAt,
      message: message || null,
    });

    // Send invitation email
    let emailSent = false;
    let emailError = null;
    
    try {
      const workspaceData = workspaceResult[0];
      const inviteUrl = `http://localhost:3000/invite/${token}`; // Force localhost:3000 for development
      
      console.log("🔧 DEBUG: Email sending details:");
      console.log("- RESEND_API_KEY exists:", !!env.RESEND_API_KEY);
      console.log("- RESEND_API_KEY length:", env.RESEND_API_KEY?.length || 0);
      console.log("- Invite URL:", inviteUrl);
      console.log("- To email:", email);
      console.log("- Workspace name:", workspaceData.name);
      
      const emailResult = await resend.emails.send({
        from: "noreply@transactions.weddingneonsign.com", // Use verified domain
        to: email,
        subject: `${workspaceData.name} çalışma alanına davetiye`,
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
              ${message ? `<p style="line-height: 1.6; color: #555; font-style: italic; border-left: 3px solid #007cba; padding-left: 15px; margin: 15px 0;">"${message}"</p>` : ''}
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
                Bu davetiye 7 gün boyunca geçerlidir. Eğer bu davetiyeyi siz talep etmediyseniz, bu e-postayı güvenle görmezden gelebilirsiniz.
              </p>
            </div>
            <div style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
              <p>Bu e-posta Yönetim Sistemi tarafından gönderilmiştir.</p>
            </div>
          </div>
        `,
      });
      
      console.log("✅ Email sent successfully! Resend response:", emailResult);
      console.log(`Invitation email sent to ${email} for workspace ${workspaceData.name}`);
      emailSent = true;
    } catch (error) {
      console.error("❌ Failed to send invitation email - FULL ERROR DETAILS:");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Full error object:", error);
      
      // Check if it's a Resend-specific error
      if (error.name === 'ResendError') {
        console.error("This is a Resend API error. Check your API key and domain verification.");
      }
      
      emailError = error.message;
      emailSent = false;
    }
    
    // Return appropriate response based on email sending result
    if (emailSent) {
      return NextResponse.json({
        message: "Invitation sent successfully",
        invitationId,
        emailSent: true,
      });
    } else {
      return NextResponse.json({
        message: "Invitation created but email could not be sent. You can resend the invitation from the members list.",
        invitationId,
        emailSent: false,
        emailError,
      }, { status: 207 }); // 207 Multi-Status: partial success
    }

  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update member role
export async function PATCH(
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
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['member', 'admin', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

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

    const isOwner = workspaceResult[0].ownerId === session.user.id;

    // Check if user is admin (only owners and admins can change roles)
    const userMembership = await db.select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      )
      .limit(1);

    const isAdmin = userMembership.length > 0 && userMembership[0].role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions to change member roles" },
        { status: 403 }
      );
    }

    // Check if target user is the workspace owner
    if (workspaceResult[0].ownerId === userId) {
      return NextResponse.json(
        { error: "Cannot change the role of the workspace owner" },
        { status: 400 }
      );
    }

    // Update member role
    const result = await db.update(workspaceMember)
      .set({ role })
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Member role updated successfully",
      member: result[0],
    });

  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from workspace
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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

    const isOwner = workspaceResult[0].ownerId === session.user.id;

    // Check if user is admin (only owners and admins can remove members)
    const userMembership = await db.select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      )
      .limit(1);

    const isAdmin = userMembership.length > 0 && userMembership[0].role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Insufficient permissions to remove members" },
        { status: 403 }
      );
    }

    // Check if trying to remove the workspace owner
    if (workspaceResult[0].ownerId === userId) {
      return NextResponse.json(
        { error: "Cannot remove the workspace owner" },
        { status: 400 }
      );
    }

    // Remove member
    const result = await db.delete(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Member removed successfully",
    });

  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}