import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { policies, policyAssignments } from "@/db/schema/tables/policies";
import { workspace } from "@/db/schema/tables/workspace";
import { company } from "@/db/schema/tables/company";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/system/policies/[policyId]/assignments - Get policy assignments with workspace/company details
export async function GET(
  request: NextRequest,
  { params }: { params: { policyId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get policy to verify it exists
    const [policy] = await db
      .select()
      .from(policies)
      .where(eq(policies.id, params.policyId));

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Get all assignments for this policy
    const assignments = await db
      .select()
      .from(policyAssignments)
      .where(eq(policyAssignments.policyId, params.policyId));

    // Get all workspaces and companies to show available targets
    const [allWorkspaces, allCompanies] = await Promise.all([
      db.select().from(workspace),
      db.select().from(company)
    ]);

    // Combine assignments with workspace/company details
    const workspaceAssignments = allWorkspaces.map(ws => {
      const assignment = assignments.find(a => a.workspaceId === ws.id);
      return {
        ...ws,
        isAssigned: !!assignment,
        assignedAt: assignment?.assignedAt || null,
        assignmentId: assignment?.id || null
      };
    });

    const companyAssignments = allCompanies.map(comp => {
      const assignment = assignments.find(a => a.companyId === comp.id);
      // Get workspace name for the company
      const companyWorkspace = allWorkspaces.find(ws => ws.id === comp.workspaceId);
      return {
        ...comp,
        workspaceName: companyWorkspace?.name || 'Unknown',
        isAssigned: !!assignment,
        assignedAt: assignment?.assignedAt || null,
        assignmentId: assignment?.id || null
      };
    });

    return NextResponse.json({
      policy,
      workspaces: workspaceAssignments,
      companies: companyAssignments
    });
  } catch (error) {
    console.error("Error fetching policy assignments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/system/policies/[policyId]/assignments - Update policy assignments
export async function POST(
  request: NextRequest,
  { params }: { params: { policyId: string } }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceIds = [], companyIds = [] } = body;

    // Verify policy exists
    const [policy] = await db
      .select()
      .from(policies)
      .where(eq(policies.id, params.policyId));

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Delete existing assignments for this policy
    await db
      .delete(policyAssignments)
      .where(eq(policyAssignments.policyId, params.policyId));

    // Create new assignments
    const newAssignments = [];

    // Add workspace assignments
    for (const workspaceId of workspaceIds) {
      newAssignments.push({
        id: nanoid(),
        policyId: params.policyId,
        workspaceId,
        companyId: null,
        assignedBy: session.user.id,
      });
    }

    // Add company assignments
    for (const companyId of companyIds) {
      newAssignments.push({
        id: nanoid(),
        policyId: params.policyId,
        workspaceId: null,
        companyId,
        assignedBy: session.user.id,
      });
    }

    // Insert new assignments if any
    if (newAssignments.length > 0) {
      await db.insert(policyAssignments).values(newAssignments);
    }

    return NextResponse.json({
      message: "Policy assignments updated successfully",
      workspaceCount: workspaceIds.length,
      companyCount: companyIds.length
    });
  } catch (error) {
    console.error("Error updating policy assignments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}