import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invitation, user, workspace, workspaceMember, company, workspaceCompany } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { name, password } = await request.json();

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: "Token, name, and password are required" },
        { status: 400 }
      );
    }

    // Find invitation by token
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

    if (invitationResult.length === 0) {
      return NextResponse.json(
        { error: "Invitation not found or already used" },
        { status: 404 }
      );
    }

    const invitationData = invitationResult[0];

    // Check if invitation is expired
    if (new Date() > new Date(invitationData.expiresAt)) {
      // Mark invitation as expired
      await db
        .update(invitation)
        .set({ 
          status: 'expired',
          updatedAt: new Date(),
        })
        .where(eq(invitation.id, invitationData.id));

      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserResult = await db
      .select()
      .from(user)
      .where(eq(user.email, invitationData.email))
      .limit(1);

    let userId: string;

    if (existingUserResult.length > 0) {
      // User already exists
      userId = existingUserResult[0].id;
      
      // Check if user is already a member of the workspace
      if (invitationData.workspaceId) {
        const existingMemberResult = await db
          .select()
          .from(workspaceMember)
          .where(
            and(
              eq(workspaceMember.workspaceId, invitationData.workspaceId),
              eq(workspaceMember.userId, userId)
            )
          )
          .limit(1);

        if (existingMemberResult.length > 0) {
          return NextResponse.json(
            { error: "User is already a member of this workspace" },
            { status: 400 }
          );
        }
      }
    } else {
      // Create new user using Better Auth
      try {
        const newUser = await auth.api.signUpEmail({
          body: {
            email: invitationData.email,
            password,
            name,
          }
        });
        
        if (!newUser) {
          return NextResponse.json(
            { error: "Failed to create user account" },
            { status: 500 }
          );
        }
        
        userId = newUser.user.id;
        
        // Auto-verify the user since they're accepting an invitation
        await db
          .update(user)
          .set({ emailVerified: true })
          .where(eq(user.id, userId));
        
        // Create a session for the user to auto-login them
        try {
          const session = await auth.api.signInEmail({
            body: {
              email: invitationData.email,
              password,
            }
          });
          console.log("✅ Session created for invited user:", session?.user?.email);
        } catch (sessionError) {
          console.log("⚠️ Session creation failed, user will need to sign in manually:", sessionError);
        }
        
      } catch (userCreationError) {
        console.error("Error creating user:", userCreationError);
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }
    }

    // Add user to workspace if this is a workspace invitation
    if (invitationData.workspaceId && invitationData.role) {
      try {
        await db.insert(workspaceMember).values({
          workspaceId: invitationData.workspaceId,
          userId,
          role: invitationData.role,
          invitedBy: invitationData.invitedBy,
          inviteStatus: 'accepted',
          joinedAt: new Date(),
        });
      } catch (membershipError) {
        console.error("Error adding user to workspace:", membershipError);
        return NextResponse.json(
          { error: "Failed to add user to workspace" },
          { status: 500 }
        );
      }
    }

    // Mark invitation as accepted
    await db
      .update(invitation)
      .set({
        status: 'accepted',
        respondedAt: new Date(),
        acceptedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(invitation.id, invitationData.id));

    // Get workspace details and first available company for response
    let workspaceData = null;
    let companyData = null;
    
    if (invitationData.workspaceId) {
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
        
        // Get the first company in this workspace for redirect
        const companiesResult = await db
          .select({
            id: company.id,
            name: company.name,
            fullName: company.fullName,
          })
          .from(company)
          .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
          .where(eq(workspaceCompany.workspaceId, workspaceData.id))
          .limit(1);
          
        if (companiesResult.length > 0) {
          const companyRecord = companiesResult[0];
          companyData = {
            id: companyRecord.id,
            name: companyRecord.name,
            fullName: companyRecord.fullName,
            slug: (companyRecord.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          };
        }
      }
    }

    return NextResponse.json({
      message: "Invitation accepted successfully",
      user: {
        id: userId,
        email: invitationData.email,
        name,
      },
      workspace: workspaceData,
      company: companyData,
    });

  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}