import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, employeePositionChange, workspaceCompany, department, unit } from "@/db/schema";
import { and, desc, eq, sql, inArray } from "drizzle-orm";

// List employee position changes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; employeeId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, employeeId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const rows = await db
      .select({
        id: employeePositionChange.id,
        previousPosition: employeePositionChange.previousPosition,
        newPosition: employeePositionChange.newPosition,
        previousDepartmentId: employeePositionChange.previousDepartmentId,
        newDepartmentId: employeePositionChange.newDepartmentId,
        previousUnitId: employeePositionChange.previousUnitId,
        newUnitId: employeePositionChange.newUnitId,
        reason: employeePositionChange.reason,
        effectiveDate: employeePositionChange.effectiveDate,
        createdAt: employeePositionChange.createdAt,
        createdBy: employeePositionChange.createdBy,
        previousDepartmentName: department.name,
        previousUnitName: unit.name,
      })
      .from(employeePositionChange)
      .leftJoin(department, eq(employeePositionChange.previousDepartmentId, department.id))
      .leftJoin(unit, eq(employeePositionChange.previousUnitId, unit.id))
      .where(
        and(
          eq(employeePositionChange.workspaceId, workspaceId),
          eq(employeePositionChange.companyId, companyId),
          eq(employeePositionChange.userId, employeeId)
        )
      )
      .orderBy(desc(employeePositionChange.effectiveDate));

    // Fetch names for new department and unit via second query to avoid complex aliasing
    const ids = {
      dept: Array.from(new Set(rows.map((r: any) => r.newDepartmentId).filter(Boolean))),
      unit: Array.from(new Set(rows.map((r: any) => r.newUnitId).filter(Boolean))),
    };
    const [newDepartments, newUnits] = await Promise.all([
      ids.dept.length
        ? db.select({ id: department.id, name: department.name }).from(department).where(inArray(department.id, ids.dept as string[]))
        : Promise.resolve([] as { id: string; name: string }[]),
      ids.unit.length
        ? db.select({ id: unit.id, name: unit.name }).from(unit).where(inArray(unit.id, ids.unit as string[]))
        : Promise.resolve([] as { id: string; name: string }[]),
    ]);
    const deptMap = new Map(newDepartments.map((d) => [d.id, d.name] as const));
    const unitMap = new Map(newUnits.map((u) => [u.id, u.name] as const));

    const enriched = rows.map((r: any) => ({
      ...r,
      newDepartmentName: deptMap.get(r.newDepartmentId) ?? null,
      newUnitName: unitMap.get(r.newUnitId) ?? null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error listing employee position changes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


