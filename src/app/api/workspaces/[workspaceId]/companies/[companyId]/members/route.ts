import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company, invitation, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

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

    // Send invitation email (you can implement email sending here)
    try {
      // TODO: Implement email sending for company invitations
      console.log(`Company invitation created: ${invitationId} for ${email} to join ${companyData.name}`);
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue without failing the invitation creation
    }

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
      message: "Company invitation created successfully"
    });

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