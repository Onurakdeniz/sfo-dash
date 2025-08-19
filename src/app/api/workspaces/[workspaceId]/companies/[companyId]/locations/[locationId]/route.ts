import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { company, workspaceCompany, companyLocation, department } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

async function ensureAccess(workspaceId: string, companyId: string) {
  const access = await db
    .select()
    .from(workspaceCompany)
    .innerJoin(company, eq(workspaceCompany.companyId, company.id))
    .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
    .limit(1);
  return access.length > 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; locationId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, locationId } = await params;

    if (!(await ensureAccess(workspaceId, companyId))) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const [loc] = await db
      .select()
      .from(companyLocation)
      .where(and(eq(companyLocation.id, locationId), eq(companyLocation.companyId, companyId), sql`${companyLocation.deletedAt} IS NULL`))
      .limit(1);

    if (!loc) return NextResponse.json({ error: "Location not found" }, { status: 404 });
    return NextResponse.json(loc);
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; locationId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, locationId } = await params;
    if (!(await ensureAccess(workspaceId, companyId))) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      code,
      locationType,
      phone,
      email,
      address,
      district,
      city,
      postalCode,
      country,
      isHeadquarters,
      notes,
      metadata,
    } = body ?? {};

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: "Location name is required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(companyLocation)
      .where(and(eq(companyLocation.id, locationId), eq(companyLocation.companyId, companyId), sql`${companyLocation.deletedAt} IS NULL`))
      .limit(1);
    if (!existing) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    // unique checks
    const nameConflict = await db
      .select()
      .from(companyLocation)
      .where(and(eq(companyLocation.companyId, companyId), eq(companyLocation.name, name.trim()), sql`${companyLocation.id} != ${locationId}`, sql`${companyLocation.deletedAt} IS NULL`))
      .limit(1);
    if (nameConflict.length > 0) {
      return NextResponse.json({ error: "Location with this name already exists" }, { status: 400 });
    }
    if (code && typeof code === 'string' && code.trim()) {
      const codeConflict = await db
        .select()
        .from(companyLocation)
        .where(and(eq(companyLocation.companyId, companyId), eq(companyLocation.code, code.trim()), sql`${companyLocation.id} != ${locationId}`, sql`${companyLocation.deletedAt} IS NULL`))
        .limit(1);
      if (codeConflict.length > 0) {
        return NextResponse.json({ error: "Location with this code already exists" }, { status: 400 });
      }
    }

    // handle HQ flag - ensure single HQ per company
    const setHQ = Boolean(isHeadquarters);
    if (setHQ) {
      await db
        .update(companyLocation)
        .set({ isHeadquarters: false, updatedAt: sql`NOW()` })
        .where(and(eq(companyLocation.companyId, companyId), sql`${companyLocation.id} != ${locationId}`, sql`${companyLocation.deletedAt} IS NULL`, eq(companyLocation.isHeadquarters, true)));
    }

    const [updated] = await db
      .update(companyLocation)
      .set({
        name: name.trim(),
        code: code?.trim() || null,
        locationType: locationType?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        district: district?.trim() || null,
        city: city?.trim() || null,
        postalCode: postalCode?.trim() || null,
        country: country?.trim() || 'Türkiye',
        isHeadquarters: setHQ,
        notes: notes?.trim() || null,
        metadata: metadata && typeof metadata === 'object' ? metadata : null,
        updatedAt: sql`NOW()`,
      })
      .where(eq(companyLocation.id, locationId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; locationId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, locationId } = await params;
    if (!(await ensureAccess(workspaceId, companyId))) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const [existing] = await db
      .select()
      .from(companyLocation)
      .where(and(eq(companyLocation.id, locationId), eq(companyLocation.companyId, companyId), sql`${companyLocation.deletedAt} IS NULL`))
      .limit(1);
    if (!existing) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    // Prevent deleting location if any active departments are assigned to it
    const assignedDepartments = await db
      .select()
      .from(department)
      .where(and(eq(department.companyId, companyId), eq(department.locationId, locationId), sql`${department.deletedAt} IS NULL`))
      .limit(1);

    if (assignedDepartments.length > 0) {
      return NextResponse.json({ error: "Cannot delete location assigned to departments. Please unassign departments first." }, { status: 400 });
    }

    await db
      .update(companyLocation)
      .set({ deletedAt: sql`NOW()`, updatedAt: sql`NOW()` })
      .where(eq(companyLocation.id, locationId));

    return NextResponse.json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



