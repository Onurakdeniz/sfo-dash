import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { policies, policyAssignments } from "@/db/schema/tables/policies";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// GET /api/system/policies/[policyId] - Get specific policy
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

    const [policy] = await db
      .select()
      .from(policies)
      .where(eq(policies.id, params.policyId));

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    // Get assignments for this policy
    const assignments = await db
      .select()
      .from(policyAssignments)
      .where(eq(policyAssignments.policyId, params.policyId));

    const workspaceCount = assignments.filter(a => a.workspaceId).length;
    const companyCount = assignments.filter(a => a.companyId).length;

    return NextResponse.json({
      ...policy,
      assignedWorkspaces: workspaceCount,
      assignedCompanies: companyCount,
      assignments
    });
  } catch (error) {
    console.error("Error fetching policy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/system/policies/[policyId] - Update policy
export async function PUT(
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
    const { title, type, content, status } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (type) updateData.type = type;
    if (content) updateData.content = content;
    if (status) {
      updateData.status = status;
      updateData.isActive = status === "published";
    }

    const [updatedPolicy] = await db
      .update(policies)
      .set(updateData)
      .where(eq(policies.id, params.policyId))
      .returning();

    if (!updatedPolicy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPolicy);
  } catch (error) {
    console.error("Error updating policy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/system/policies/[policyId] - Delete policy
export async function DELETE(
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

    // First delete all assignments
    await db
      .delete(policyAssignments)
      .where(eq(policyAssignments.policyId, params.policyId));

    // Then delete the policy
    const [deletedPolicy] = await db
      .delete(policies)
      .where(eq(policies.id, params.policyId))
      .returning();

    if (!deletedPolicy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Policy deleted successfully" });
  } catch (error) {
    console.error("Error deleting policy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}