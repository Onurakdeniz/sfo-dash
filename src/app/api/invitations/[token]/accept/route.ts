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

    // Process invitation acceptance and workspace membership in a transaction
    try {
      await db.transaction(async (tx) => {
        // Mark invitation as accepted first (user has successfully registered)
        await tx
          .update(invitation)
          .set({
            status: 'accepted',
            respondedAt: new Date(),
            acceptedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(invitation.id, invitationData.id));

        // Add user to workspace (required for both workspace and company invitations)
        if (invitationData.workspaceId && invitationData.role) {
          // For company invitations, we still add to workspace but with company context
          const membershipData = {
            workspaceId: invitationData.workspaceId,
            userId,
            role: invitationData.role,
            invitedBy: invitationData.invitedBy,
            inviteStatus: 'accepted',
            joinedAt: new Date(),
          };

          // Add company context to permissions if this is a company invitation
          if (invitationData.type === 'company' && invitationData.companyId) {
            membershipData.permissions = JSON.stringify({
              restrictedToCompany: invitationData.companyId,
              invitationType: 'company'
            });
          }

          await tx.insert(workspaceMember).values(membershipData);
        }
      });
      
      console.log("✅ Invitation accepted and workspace membership created successfully");
    } catch (transactionError) {
      console.error("❌ Error in invitation acceptance transaction:", transactionError);
      
      // If transaction fails, at least try to mark invitation as accepted
      // This is a fallback to ensure invitation status is updated even if membership fails
      try {
        await db
          .update(invitation)
          .set({
            status: 'accepted',
            respondedAt: new Date(),
            acceptedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(invitation.id, invitationData.id));
        console.log("✅ Invitation marked as accepted despite membership error");
      } catch (fallbackError) {
        console.error("❌ Critical error: Could not update invitation status:", fallbackError);
        return NextResponse.json(
          { error: "Failed to process invitation acceptance" },
          { status: 500 }
        );
      }
    }

    // Get workspace details and company information for response
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
        
        // If this is a company invitation, get the specific company
        if (invitationData.type === 'company' && invitationData.companyId) {
          const companyResult = await db
            .select({
              id: company.id,
              name: company.name,
              fullName: company.fullName,
            })
            .from(company)
            .where(eq(company.id, invitationData.companyId))
            .limit(1);
            
          if (companyResult.length > 0) {
            const companyRecord = companyResult[0];
            companyData = {
              id: companyRecord.id,
              name: companyRecord.name,
              fullName: companyRecord.fullName,
              slug: (companyRecord.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            };
          }
        } else {
          // For workspace invitations, get the first company in this workspace for redirect
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
    }

    return NextResponse.json({
      message: "Invitation accepted successfully",
      invitationType: invitationData.type,
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