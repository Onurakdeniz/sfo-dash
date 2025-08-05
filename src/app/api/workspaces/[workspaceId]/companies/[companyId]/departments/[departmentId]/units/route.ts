import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { unit, department, company, workspaceCompany, user } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// GET all units for a department
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

    // Verify department exists and belongs to the company
    const departmentExists = await db
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

    if (departmentExists.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Fetch all units for this department with lead information
    const units = await db
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
          eq(unit.departmentId, departmentId),
          sql`${unit.deletedAt} IS NULL`
        )
      )
      .orderBy(unit.createdAt);

    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create a new unit
export async function POST(
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
    const { name, description, staffCount, leadId } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Unit name is required" },
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

    // Verify department exists and belongs to the company
    const departmentExists = await db
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

    if (departmentExists.length === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    // Check if unit name already exists in this department
    const existingUnit = await db
      .select()
      .from(unit)
      .where(
        and(
          eq(unit.departmentId, departmentId),
          eq(unit.name, name.trim()),
          sql`${unit.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingUnit.length > 0) {
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

    // Create the unit
    const unitId = randomUUID();
    const [newUnit] = await db
      .insert(unit)
      .values({
        id: unitId,
        departmentId,
        name: name.trim(),
        description: description?.trim() || null,
        staffCount: staffCount || 0,
        leadId: leadId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Fetch the created unit with lead information
    const [unitWithLead] = await db
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

    return NextResponse.json(unitWithLead, { status: 201 });
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}