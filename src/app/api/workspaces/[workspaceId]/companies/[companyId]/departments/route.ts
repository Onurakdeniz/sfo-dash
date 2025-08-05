import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { department, company, workspaceCompany, user, workspace } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

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

    // Verify user has access to this workspace
    const workspaceAccess = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(company.id, companyId)
        )
      )
      .limit(1);

    if (workspaceAccess.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Fetch departments with manager info and unit count
    const departments = await db
      .select({
        id: department.id,
        companyId: department.companyId,
        parentDepartmentId: department.parentDepartmentId,
        code: department.code,
        name: department.name,
        description: department.description,
        responsibilityArea: department.responsibilityArea,
        goals: department.goals,
        managerId: department.managerId,
        managerName: user.name,
        managerEmail: user.email,
        mailAddress: department.mailAddress,
        notes: department.notes,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
        deletedAt: department.deletedAt,
        // Count units for each department
        unitCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM units 
          WHERE units.department_id = ${department.id} 
          AND units.deleted_at IS NULL
        )`.as('unitCount')
      })
      .from(department)
      .leftJoin(user, eq(department.managerId, user.id))
      .where(
        and(
          eq(department.companyId, companyId),
          sql`${department.deletedAt} IS NULL`
        )
      )
      .orderBy(department.name);

    return NextResponse.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const {
      name,
      code,
      description,
      responsibilityArea,
      goals,
      managerId,
      parentDepartmentId,
      mailAddress,
      notes
    } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const { workspaceId, companyId } = await params;

    // Verify user has access to this workspace and company
    const workspaceAccess = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(company.id, companyId)
        )
      )
      .limit(1);

    if (workspaceAccess.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if department with same name already exists in company
    const existingDepartment = await db
      .select()
      .from(department)
      .where(
        and(
          eq(department.companyId, companyId),
          eq(department.name, name.trim()),
          sql`${department.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingDepartment.length > 0) {
      return NextResponse.json(
        { error: "Department with this name already exists" },
        { status: 400 }
      );
    }

    // If code is provided, check uniqueness within company
    if (code && code.trim()) {
      const existingCode = await db
        .select()
        .from(department)
        .where(
          and(
            eq(department.companyId, companyId),
            eq(department.code, code.trim()),
            sql`${department.deletedAt} IS NULL`
          )
        )
        .limit(1);

      if (existingCode.length > 0) {
        return NextResponse.json(
          { error: "Department with this code already exists" },
          { status: 400 }
        );
      }
    }

    // Generate department ID
    const departmentId = `dept_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Prepare goals - ensure it's a proper JSON object
    let processedGoals;
    if (goals && typeof goals === 'object') {
      processedGoals = {
        shortTerm: goals.shortTerm || null,
        mediumTerm: goals.mediumTerm || null,
        longTerm: goals.longTerm || null
      };
    } else {
      processedGoals = { shortTerm: null, mediumTerm: null, longTerm: null };
    }

    // Create department
    const [newDepartment] = await db
      .insert(department)
      .values({
        id: departmentId,
        companyId: companyId,
        parentDepartmentId: parentDepartmentId?.trim() || null,
        code: code?.trim() || null,
        name: name.trim(),
        description: description?.trim() || null,
        responsibilityArea: responsibilityArea?.trim() || null,
        goals: processedGoals,
        managerId: managerId?.trim() || null,
        mailAddress: mailAddress?.trim() || null,
        notes: notes?.trim() || null,
      })
      .returning();

    return NextResponse.json(newDepartment);
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}