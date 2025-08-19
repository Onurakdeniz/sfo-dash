import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, department, employeeProfile, user, workspaceCompany, workspaceMember } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// List employees for a company within a workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId } = await params;

    // Verify the company is in the workspace
    const access = await db
      .select({ companyId: workspaceCompany.companyId })
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);

    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Fetch ONLY employees who have a profile in this company within the workspace
    const rows = await db
      .select({
        member: workspaceMember,
        user,
        profile: employeeProfile,
        department,
      })
      .from(employeeProfile)
      .innerJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, employeeProfile.workspaceId),
          eq(workspaceMember.userId, employeeProfile.userId)
        )
      )
      .leftJoin(user, eq(workspaceMember.userId, user.id))
      .leftJoin(department, eq(employeeProfile.departmentId, department.id))
      .where(
        and(
          eq(employeeProfile.workspaceId, workspaceId),
          eq(employeeProfile.companyId, companyId)
        )
      );

    const employees = rows
      .filter((r) => r.user !== null)
      .map((r) => ({
        id: r.user!.id,
        name: r.user!.name,
        email: r.user!.email,
        image: (r.user as any).image as string | null,
        role: r.member.role,
        profile: r.profile
          ? {
              position: r.profile.position,
              startDate: r.profile.startDate,
              endDate: r.profile.endDate,
              departmentId: r.profile.departmentId,
              managerId: r.profile.managerId,
            }
          : null,
        department: r.department
          ? {
              id: r.department.id,
              name: r.department.name,
            }
          : null,
      }));

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


