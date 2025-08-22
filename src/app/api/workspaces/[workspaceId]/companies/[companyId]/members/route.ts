import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company, invitation, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

// POST - Invite a new member to a specific company within a workspace
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId } = await params;
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

    // Check if user is workspace owner or has admin permissions
    const isWorkspaceOwner = workspaceResult[0].ownerId === session.user.id;
    
    if (!isWorkspaceOwner) {
      // Check if user is admin member of the workspace
      const userMembership = await db.select()
        .from(workspace)
        .leftJoin(
          db.select().from(workspaceCompany).as('wc'),
          eq(workspace.id, workspaceId)
        )
        .where(
          and(
            eq(workspace.id, workspaceId),
            eq(workspace.ownerId, session.user.id)
          )
        )
        .limit(1);

      if (userMembership.length === 0) {
        return NextResponse.json(
          { error: "Insufficient permissions to invite members" },
          { status: 403 }
        );
      }
    }

    // Verify company exists and belongs to the workspace
    const companyInWorkspace = await db.select({
      company: company,
    })
    .from(workspaceCompany)
    .leftJoin(company, eq(workspaceCompany.companyId, company.id))
    .where(
      and(
        eq(workspaceCompany.workspaceId, workspaceId),
        eq(workspaceCompany.companyId, companyId)
      )
    )
    .limit(1);

    if (companyInWorkspace.length === 0 || !companyInWorkspace[0].company) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    const companyData = companyInWorkspace[0].company;

    // Check if user already exists
    const existingUser = await db.select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    // Check for pending invitation to this company
    const existingInvitation = await db.select()
      .from(invitation)
      .where(
        and(
          eq(invitation.email, email),
          eq(invitation.companyId, companyId),
          eq(invitation.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return NextResponse.json(
        { error: "An invitation is already pending for this email to this company" },
        { status: 400 }
      );
    }

    // Create company invitation
    const invitationId = `invitation_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(invitation).values({
      id: invitationId,
      email,
      token,
      type: 'company',
      role,
      companyId,
      workspaceId, // Still reference the workspace for context
      invitedBy: session.user.id,
      expiresAt,
      message: message || null,
    });

    // Send invitation email
    let emailSent = false;
    let emailError = null;
    
    try {
      const workspaceData = workspaceResult[0];
      const inviteUrl = `http://localhost:3000/invite/${token}`;
      
      console.log("🔧 DEBUG: Company invitation email sending details:");
      console.log("- RESEND_API_KEY exists:", !!env.RESEND_API_KEY);
      console.log("- RESEND_API_KEY length:", env.RESEND_API_KEY?.length || 0);
      console.log("- Invite URL:", inviteUrl);
      console.log("- To email:", email);
      console.log("- Company name:", companyData.name);
      console.log("- Workspace name:", workspaceData.name);
      
      const emailResult = await resend.emails.send({
        from: "noreply@transactions.weddingneonsign.com",
        to: email,
        subject: `${companyData.name} şirketine davetiye`,
        tracking: {
          click: false,
          open: false
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Şirket Davetiyesi</h1>
            <div style="background-color: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #007cba; margin-bottom: 15px;">Merhaba!</h2>
              <p style="line-height: 1.6; color: #555;">
                <strong>${companyData.name}</strong> şirketine katılmak için davet edildiniz.
              </p>
              <p style="line-height: 1.6; color: #555;">
                Bu şirket <strong>${workspaceData.name}</strong> çalışma alanı içerisinde yer almaktadır.
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
      
      console.log("✅ Company invitation email sent successfully! Resend response:", emailResult);
      console.log(`Company invitation email sent to ${email} for company ${companyData.name}`);
      emailSent = true;
    } catch (error) {
      console.error("❌ Failed to send company invitation email - FULL ERROR DETAILS:");
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
        success: true,
        invitation: {
          id: invitationId,
          email,
          role,
          type: 'company',
          companyId,
          companyName: companyData.name,
          workspaceId,
          token,
          expiresAt,
        },
        message: "Company invitation sent successfully",
        emailSent: true,
      });
    } else {
      return NextResponse.json({
        success: true,
        invitation: {
          id: invitationId,
          email,
          role,
          type: 'company',
          companyId,
          companyName: companyData.name,
          workspaceId,
          token,
          expiresAt,
        },
        message: "Company invitation created but email could not be sent. You can resend the invitation from the members list.",
        emailSent: false,
        emailError,
      }, { status: 207 }); // 207 Multi-Status: partial success
    }

  } catch (error) {
    console.error("Error creating company invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetch members of a specific company (if needed)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId } = await params;

    // For now, return empty array as company-specific members aren't implemented yet
    // This would need a company_members table or similar to track company-specific memberships
    return NextResponse.json({
      members: [],
      message: "Company-specific member management not yet implemented"
    });

  } catch (error) {
    console.error("Error fetching company members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}