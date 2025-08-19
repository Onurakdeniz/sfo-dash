import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { policies, policyAssignments } from "@/db/schema/tables/policies";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/system/policies - Get all policies
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const companyId = searchParams.get('companyId');

    // If companyId is provided, only return policies assigned to that company
    if (companyId) {
      const assigned = await db
        .select()
        .from(policyAssignments)
        .where(eq(policyAssignments.companyId, companyId));

      const assignedPolicyIds = new Set(assigned.map(a => a.policyId));

      const allPolicies = await db
        .select({
          id: policies.id,
          title: policies.title,
          type: policies.type,
          content: policies.content,
          status: policies.status,
          isActive: policies.isActive,
          createdAt: policies.createdAt,
          updatedAt: policies.updatedAt,
          createdBy: policies.createdBy,
        })
        .from(policies)
        .orderBy(desc(policies.updatedAt));

      const filtered = allPolicies.filter(p => assignedPolicyIds.has(p.id));

      const withCounts = await Promise.all(
        filtered.map(async (policy) => {
          const assignments = await db
            .select()
            .from(policyAssignments)
            .where(eq(policyAssignments.policyId, policy.id));
          const workspaceCount = assignments.filter(a => a.workspaceId).length;
          const companyCount = assignments.filter(a => a.companyId).length;
          return { ...policy, assignedWorkspaces: workspaceCount, assignedCompanies: companyCount };
        })
      );

      return NextResponse.json(withCounts);
    }

    // Default: return all policies with counts
    const allPolicies = await db
      .select({
        id: policies.id,
        title: policies.title,
        type: policies.type,
        content: policies.content,
        status: policies.status,
        isActive: policies.isActive,
        createdAt: policies.createdAt,
        updatedAt: policies.updatedAt,
        createdBy: policies.createdBy,
      })
      .from(policies)
      .orderBy(desc(policies.updatedAt));

    const withCounts = await Promise.all(
      allPolicies.map(async (policy) => {
        const assignments = await db
          .select()
          .from(policyAssignments)
          .where(eq(policyAssignments.policyId, policy.id));
        const workspaceCount = assignments.filter(a => a.workspaceId).length;
        const companyCount = assignments.filter(a => a.companyId).length;
        return { ...policy, assignedWorkspaces: workspaceCount, assignedCompanies: companyCount };
      })
    );

    return NextResponse.json(withCounts);
  } catch (error) {
    console.error("Error fetching policies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/system/policies - Create new policy
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, content, status = "draft", workspaceId, companyId } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    // Ensure content is not null for database
    const policyContent = content || "";

    const policyId = nanoid();

    const [newPolicy] = await db
      .insert(policies)
      .values({
        id: policyId,
        title,
        type,
        content: policyContent,
        status,
        isActive: status === "published",
        createdBy: session.user.id,
      })
      .returning();

    // If companyId or workspaceId provided, assign the policy
    if (companyId || workspaceId) {
      await db.insert(policyAssignments).values({
        id: nanoid(),
        policyId,
        workspaceId: workspaceId || null,
        companyId: companyId || null,
        assignedBy: session.user.id,
      });
    }

    return NextResponse.json(newPolicy, { status: 201 });
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}