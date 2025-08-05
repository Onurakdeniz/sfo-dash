import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { unit, department, company, workspaceCompany, user } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET individual unit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; departmentId: string; unitId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, departmentId, unitId } = await params;

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

    // Fetch unit with lead information
    const [unitData] = await db
      .select({
        id: unit.id,
        name: unit.name,
        description: unit.description,
        staffCount: unit.staffCount,
        leadId: unit.leadId,
        leadName: user.name,
        leadEmail: user.email,
        departmentId: unit.departmentId,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
        deletedAt: unit.deletedAt,
      })
      .from(unit)
      .leftJoin(user, eq(unit.leadId, user.id))
      .where(
        and(
          eq(unit.id, unitId),
          eq(unit.departmentId, departmentId),
          sql`${unit.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (!unitData) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    return NextResponse.json(unitData);
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update unit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; departmentId: string; unitId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, staffCount, leadId } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Unit name is required" },
        { status: 400 }
      );
    }

    const { workspaceId, companyId, departmentId, unitId } = await params;

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

    // Check if unit exists
    const existingUnit = await db
      .select()
      .from(unit)
      .where(
        and(
          eq(unit.id, unitId),
          eq(unit.departmentId, departmentId),
          sql`${unit.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingUnit.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Check if unit name already exists in this department (excluding current unit)
    const duplicateUnit = await db
      .select()
      .from(unit)
      .where(
        and(
          eq(unit.departmentId, departmentId),
          eq(unit.name, name.trim()),
          sql`${unit.id} != ${unitId}`,
          sql`${unit.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (duplicateUnit.length > 0) {
      return NextResponse.json(
        { error: "Unit name already exists in this department" },
        { status: 409 }
      );
    }

    // If leadId is provided, verify the user exists
    if (leadId) {
      const leadExists = await db
        .select()
        .from(user)
        .where(eq(user.id, leadId))
        .limit(1);

      if (leadExists.length === 0) {
        return NextResponse.json(
          { error: "Selected lead user not found" },
          { status: 400 }
        );
      }
    }

    // Update the unit
    await db
      .update(unit)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        staffCount: staffCount || 0,
        leadId: leadId || null,
        updatedAt: new Date(),
      })
      .where(eq(unit.id, unitId));

    // Fetch the updated unit with lead information
    const [updatedUnit] = await db
      .select({
        id: unit.id,
        name: unit.name,
        description: unit.description,
        staffCount: unit.staffCount,
        leadId: unit.leadId,
        leadName: user.name,
        leadEmail: user.email,
        departmentId: unit.departmentId,
        createdAt: unit.createdAt,
        updatedAt: unit.updatedAt,
        deletedAt: unit.deletedAt,
      })
      .from(unit)
      .leftJoin(user, eq(unit.leadId, user.id))
      .where(eq(unit.id, unitId))
      .limit(1);

    return NextResponse.json(updatedUnit);
  } catch (error) {
    console.error("Error updating unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE unit (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; departmentId: string; unitId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, departmentId, unitId } = await params;

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

    // Check if unit exists
    const existingUnit = await db
      .select()
      .from(unit)
      .where(
        and(
          eq(unit.id, unitId),
          eq(unit.departmentId, departmentId),
          sql`${unit.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingUnit.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    // Soft delete the unit by setting deletedAt timestamp
    await db
      .update(unit)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(unit.id, unitId));

    return NextResponse.json({ message: "Unit deleted successfully" });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}