import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { company, workspaceCompany, companyLocation } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId } = await params;

    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);

    if (access.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const locations = await db
      .select()
      .from(companyLocation)
      .where(and(eq(companyLocation.companyId, companyId), sql`${companyLocation.deletedAt} IS NULL`))
      .orderBy(companyLocation.isHeadquarters, companyLocation.name);

    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId } = await params;

    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);

    if (access.length === 0) {
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

    // Enforce unique name and code per company (soft-delete aware)
    const conflictByName = await db
      .select()
      .from(companyLocation)
      .where(and(eq(companyLocation.companyId, companyId), eq(companyLocation.name, name.trim()), sql`${companyLocation.deletedAt} IS NULL`))
      .limit(1);
    if (conflictByName.length > 0) {
      return NextResponse.json({ error: "Location with this name already exists" }, { status: 400 });
    }

    if (code && typeof code === 'string' && code.trim()) {
      const conflictByCode = await db
        .select()
        .from(companyLocation)
        .where(and(eq(companyLocation.companyId, companyId), eq(companyLocation.code, code.trim()), sql`${companyLocation.deletedAt} IS NULL`))
        .limit(1);
      if (conflictByCode.length > 0) {
        return NextResponse.json({ error: "Location with this code already exists" }, { status: 400 });
      }
    }

    // Ensure only one HQ per company
    let shouldSetHQ = Boolean(isHeadquarters);
    if (shouldSetHQ) {
      // clear existing HQ flag
      await db
        .update(companyLocation)
        .set({ isHeadquarters: false, updatedAt: sql`NOW()` })
        .where(and(eq(companyLocation.companyId, companyId), sql`${companyLocation.deletedAt} IS NULL`, eq(companyLocation.isHeadquarters, true)));
    }

    const id = `loc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const [created] = await db
      .insert(companyLocation)
      .values({
        id,
        companyId,
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
        isHeadquarters: shouldSetHQ,
        notes: notes?.trim() || null,
        metadata: metadata && typeof metadata === 'object' ? metadata : null,
      })
      .returning();

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



