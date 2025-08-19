import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { department, company, workspaceCompany, user, companyLocation, employeeProfile } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; departmentId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, departmentId } = await params;

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

    // Fetch department with manager info and unit count
    const [departmentData] = await db
      .select({
        id: department.id,
        companyId: department.companyId,
        parentDepartmentId: department.parentDepartmentId,
        locationId: department.locationId,
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
        // Count units for this department
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
          eq(department.id, departmentId),
          eq(department.companyId, companyId),
          sql`${department.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!departmentData) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json(departmentData);
  } catch (error) {
    console.error("Error fetching department:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; departmentId: string }> }
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
      locationId,
      mailAddress,
      notes
    } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const { workspaceId, companyId, departmentId } = await params;

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

    // Check if department exists
    const existingDepartment = await db
      .select()
      .from(department)
      .where(
        and(
          eq(department.id, departmentId),
          eq(department.companyId, companyId),
          sql`${department.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingDepartment.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // If locationId is provided, validate it belongs to the same company
    if (locationId && typeof locationId === 'string' && locationId.trim()) {
      const locationExists = await db
        .select()
        .from(companyLocation)
        .where(
          and(
            eq(companyLocation.id, locationId.trim()),
            eq(companyLocation.companyId, companyId),
            sql`${companyLocation.deletedAt} IS NULL`
          )
        )
        .limit(1);
      if (locationExists.length === 0) {
        return NextResponse.json({ error: "Invalid location for this company" }, { status: 400 });
      }
    }

    // Check if another department with same name already exists in company
    const nameConflict = await db
      .select()
      .from(department)
      .where(
        and(
          eq(department.companyId, companyId),
          eq(department.name, name.trim()),
          sql`${department.id} != ${departmentId}`,
          sql`${department.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (nameConflict.length > 0) {
      return NextResponse.json(
        { error: "Department with this name already exists" },
        { status: 400 }
      );
    }

    // If code is provided, check uniqueness within company
    if (code && code.trim()) {
      const codeConflict = await db
        .select()
        .from(department)
        .where(
          and(
            eq(department.companyId, companyId),
            eq(department.code, code.trim()),
            sql`${department.id} != ${departmentId}`,
            sql`${department.deletedAt} IS NULL`
          )
        )
        .limit(1);

      if (codeConflict.length > 0) {
        return NextResponse.json(
          { error: "Department with this code already exists" },
          { status: 400 }
        );
      }
    }

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

    // Update department
    const [updatedDepartment] = await db
      .update(department)
      .set({
        parentDepartmentId: parentDepartmentId?.trim() || null,
        locationId: locationId?.trim() || null,
        code: code?.trim() || null,
        name: name.trim(),
        description: description?.trim() || null,
        responsibilityArea: responsibilityArea?.trim() || null,
        goals: processedGoals,
        managerId: managerId?.trim() || null,
        mailAddress: mailAddress?.trim() || null,
        notes: notes?.trim() || null,
        updatedAt: sql`NOW()`
      })
      .where(eq(department.id, departmentId))
      .returning();

    return NextResponse.json(updatedDepartment);
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; departmentId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, departmentId } = await params;

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

    // Check if department exists and is not already deleted
    const existingDepartment = await db
      .select()
      .from(department)
      .where(
        and(
          eq(department.id, departmentId),
          eq(department.companyId, companyId),
          sql`${department.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingDepartment.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Prevent deleting department if there are employees assigned to it
    const assignedEmployees = await db
      .select()
      .from(employeeProfile)
      .where(
        and(
          eq(employeeProfile.companyId, companyId),
          eq(employeeProfile.departmentId, departmentId)
        )
      )
      .limit(1);

    if (assignedEmployees.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with assigned employees. Please reassign or remove employees first." },
        { status: 400 }
      );
    }

    // Check if department has child departments
    const childDepartments = await db
      .select()
      .from(department)
      .where(
        and(
          eq(department.parentDepartmentId, departmentId),
          sql`${department.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (childDepartments.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with child departments" },
        { status: 400 }
      );
    }

    // Check if department has units
    const hasUnits = await db
      .select()
      .from(sql`units`)
      .where(
        and(
          sql`department_id = ${departmentId}`,
          sql`deleted_at IS NULL`
        )
      )
      .limit(1);

    if (hasUnits.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete department with units" },
        { status: 400 }
      );
    }

    // Soft delete the department
    await db
      .update(department)
      .set({
        deletedAt: sql`NOW()`,
        updatedAt: sql`NOW()`
      })
      .where(eq(department.id, departmentId));

    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}