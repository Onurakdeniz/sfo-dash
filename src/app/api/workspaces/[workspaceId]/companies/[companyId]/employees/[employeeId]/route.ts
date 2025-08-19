import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { employeeProfile, workspace, workspaceCompany, company, user, workspaceMember } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// GET employee profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; employeeId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, employeeId } = await params;

    // Verify access to workspace & company mapping
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const [row] = await db
      .select()
      .from(employeeProfile)
      .where(and(eq(employeeProfile.workspaceId, workspaceId), eq(employeeProfile.companyId, companyId), eq(employeeProfile.userId, employeeId)))
      .limit(1);

    if (!row) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(row);
  } catch (error) {
    console.error("Error fetching employee profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT upsert employee profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; employeeId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, employeeId } = await params;
    const body = await request.json();

    // Verify access
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Authorization: allow workspace owner, admins, or members restricted to this company
    const [ws] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    const [membership] = await db
      .select({ role: workspaceMember.role, permissions: workspaceMember.permissions })
      .from(workspaceMember)
      .where(and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)))
      .limit(1);

    let canEdit = false;
    if (ws && ws.ownerId === session.user.id) {
      canEdit = true;
    } else if (membership) {
      if (String(membership.role) === "admin") {
        canEdit = true;
      } else {
        try {
          const perms = typeof (membership as any).permissions === "string"
            ? JSON.parse((membership as any).permissions)
            : (membership as any).permissions;
          if (perms && perms.restrictedToCompany && perms.restrictedToCompany === companyId) {
            canEdit = true;
          }
        } catch (_e) {
          // ignore parse errors
        }
      }
    }

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If only image is being updated, perform user image update and return
    if (body && typeof body.image === "string" && Object.keys(body).length === 1) {
      const updated = await db
        .update(user)
        .set({ image: body.image })
        .where(eq(user.id, employeeId))
        .returning();
      if (updated.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({ id: updated[0].id, image: body.image });
    }

    const newId = `eprof_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const baseValues: any = {
      workspaceId,
      companyId,
      userId: employeeId,
      nationalId: body?.nationalId ?? null,
      birthDate: body?.birthDate ? new Date(body.birthDate) : null,
      gender: body?.gender ?? null,
      address: body?.address ?? null,
      phone: body?.phone ?? null,
      emergencyContactName: body?.emergencyContactName ?? null,
      emergencyContactPhone: body?.emergencyContactPhone ?? null,
      position: body?.position ?? null,
      employmentType: body?.employmentType ?? null,
      startDate: body?.startDate ? new Date(body.startDate) : null,
      endDate: body?.endDate ? new Date(body.endDate) : null,
      notes: body?.notes ?? null,
      // store extended structured info such as work history, education, certificates
      metadata: body?.metadata ?? null,
      updatedAt: new Date(),
    };

    // Upsert logic: try update first, else insert
    const [existing] = await db
      .select({ id: employeeProfile.id })
      .from(employeeProfile)
      .where(and(eq(employeeProfile.workspaceId, workspaceId), eq(employeeProfile.companyId, companyId), eq(employeeProfile.userId, employeeId)))
      .limit(1);

    if (existing) {
      await db
        .update(employeeProfile)
        .set(baseValues)
        .where(and(eq(employeeProfile.id, existing.id)));
      return NextResponse.json({ id: existing.id, ...baseValues });
    } else {
      const insertValues = { id: newId, ...baseValues };
      const [inserted] = await db
        .insert(employeeProfile)
        .values(insertValues)
        .returning();
      return NextResponse.json(inserted, { status: 201 });
    }
  } catch (error) {
    console.error("Error upserting employee profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


