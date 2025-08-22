import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { talep, workspace, workspaceCompany, workspaceMember, company, customer, user, talepActivity } from "@/db/schema";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { DatabaseErrorHandler } from "@/lib/database-errors";
import { z } from "zod";
import { slugifyCompanyFirstWord } from "@/lib/slug";
import { randomUUID } from "crypto";

// Validation schema for updating talep
const updateTalepSchema = z.object({
  title: z.string().min(1, "Talep başlığı gerekli").max(255).optional(),
  description: z.string().min(1, "Talep açıklaması gerekli").optional(),
  type: z.enum([
    "product_inquiry",
    "price_request",
    "quotation_request",
    "order_request",
    "sample_request",
    "delivery_status",
    "return_request",
    "billing",
    "technical_support",
    "general_inquiry",
    "complaint",
    "feature_request",
    "bug_report",
    "installation",
    "training",
    "maintenance",
    "other"
  ]).optional(),
  category: z.enum([
    "hardware",
    "software",
    "network",
    "database",
    "security",
    "performance",
    "integration",
    "reporting",
    "user_access",
    "other"
  ]).optional().nullable(),
  status: z.enum(["new", "in_progress", "waiting", "resolved", "closed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),

  // Assignment
  assignedTo: z.string().optional().nullable(),

  // Contact information for this request
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email("Geçersiz email formatı").optional().or(z.literal("")).nullable(),

  // Additional details
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),

  // Scheduling and financial
  deadline: z.string().optional().nullable(),
  estimatedHours: z.coerce.number().min(0).optional().nullable(),
  actualHours: z.coerce.number().min(0).optional().nullable(),
  estimatedCost: z.coerce.number().min(0).optional().nullable(),
  actualCost: z.coerce.number().min(0).optional().nullable(),
  billingStatus: z.string().optional().nullable(),

  // Resolution
  resolution: z.string().optional().nullable(),
  resolutionDate: z.date().optional().nullable(),
});

function normalizeTalepBody(input: any) {
  const emptyToNull = (v: any) => (v === '' || v === undefined ? null : v);
  return {
    ...input,
    category: input?.category === 'select' ? null : emptyToNull(input?.category),
    contactName: emptyToNull(input?.contactName),
    contactPhone: emptyToNull(input?.contactPhone),
    contactEmail: emptyToNull(input?.contactEmail),
    notes: emptyToNull(input?.notes),
    resolution: emptyToNull(input?.resolution),
    deadline: input?.deadline === '' || input?.deadline === undefined ? null : input.deadline,
    estimatedHours: input?.estimatedHours === '' || input?.estimatedHours === undefined ? null : input.estimatedHours,
    actualHours: input?.actualHours === '' || input?.actualHours === undefined ? null : input.actualHours,
    estimatedCost: input?.estimatedCost === '' || input?.estimatedCost === undefined ? null : input.estimatedCost,
    actualCost: input?.actualCost === '' || input?.actualCost === undefined ? null : input.actualCost,
    billingStatus: emptyToNull(input?.billingStatus),
    resolutionDate: input?.resolutionDate === '' || input?.resolutionDate === undefined ? null : (input.resolutionDate ? new Date(input.resolutionDate) : null),
  };
}

// Helper function to log activity
async function logTalepActivity(
  talepId: string,
  activityType: string,
  description: string,
  oldValue?: string,
  newValue?: string,
  metadata?: any,
  performedBy?: string
) {
  await db.insert(talepActivity).values({
    id: randomUUID(),
    talepId,
    activityType,
    description,
    oldValue,
    newValue,
    metadata: metadata || {},
    performedBy: performedBy || null,
    createdAt: new Date(),
  });
}

// GET - Get specific talep
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, talepId } = await params;

    // Resolve workspace by id or slug
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(
        or(
          eq(workspace.id, workspaceIdOrSlug),
          eq(workspace.slug, workspaceIdOrSlug)
        )
      )
      .limit(1);

    if (foundWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;

    // Try resolve by company id directly in this workspace
    const companyById = await db.select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);

    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      // Fallback: resolve by slug derived from company name (first word)
      const companiesInWorkspace = await db.select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));

      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) {
        resolvedCompanyId = matched.cmp.id;
      }
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    // Get talep with related data
    // Alias users for multiple joins
    const assignedUser = alias(user, 'assigned_user');
    const createdUser = alias(user, 'created_user');

    const talepData = await db.select({
      code: talep.code,
      id: talep.id,
      title: talep.title,
      description: talep.description,
      type: talep.type,
      category: talep.category,
      status: talep.status,
      priority: talep.priority,
      customerId: talep.customerId,
      assignedTo: talep.assignedTo,
      assignedBy: talep.assignedBy,
      contactName: talep.contactName,
      contactPhone: talep.contactPhone,
      contactEmail: talep.contactEmail,
      deadline: talep.deadline,
      estimatedHours: talep.estimatedHours,
      actualHours: talep.actualHours,
      estimatedCost: talep.estimatedCost,
      actualCost: talep.actualCost,
      billingStatus: talep.billingStatus,
      resolution: talep.resolution,
      resolutionDate: talep.resolutionDate,
      tags: talep.tags,
      metadata: talep.metadata,
      createdAt: talep.createdAt,
      updatedAt: talep.updatedAt,
      createdBy: talep.createdBy,
      updatedBy: talep.updatedBy,
      customer: {
        id: customer.id,
        name: customer.name,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        customerType: customer.customerType,
      },
      assignedToUser: {
        id: assignedUser.id,
        name: assignedUser.name,
        email: assignedUser.email,
      },
      createdByUser: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
      },
    })
      .from(talep)
      .leftJoin(customer, eq(talep.customerId, customer.id))
      .leftJoin(assignedUser, eq(talep.assignedTo, assignedUser.id))
      .leftJoin(createdUser, eq(talep.createdBy, createdUser.id))
      .where(
        and(
          eq(talep.id, talepId),
          eq(talep.workspaceId, resolvedWorkspace.id),
          eq(talep.companyId, resolvedCompanyId),
          isNull(talep.deletedAt)
        )
      )
      .limit(1);

    if (talepData.length === 0) {
      return NextResponse.json(
        { error: "Talep not found" },
        { status: 404 }
      );
    }

    // Get recent activities
    const activities = await db.select()
      .from(talepActivity)
      .where(eq(talepActivity.talepId, talepId))
      .orderBy(desc(talepActivity.createdAt))
      .limit(10);

    return NextResponse.json({
      talep: talepData[0],
      activities,
    });

  } catch (error) {
    console.error("Error fetching talep:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update specific talep
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, talepId } = await params;
    const rawBody = await request.json();
    const body = normalizeTalepBody(rawBody);

    // Validate input
    const validatedData = updateTalepSchema.parse(body);

    // Resolve workspace by id or slug
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(
        or(
          eq(workspace.id, workspaceIdOrSlug),
          eq(workspace.slug, workspaceIdOrSlug)
        )
      )
      .limit(1);

    if (foundWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;

    // Try resolve by company id directly in this workspace
    const companyById = await db.select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);

    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      // Fallback: resolve by slug derived from company name (first word)
      const companiesInWorkspace = await db.select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));

      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) {
        resolvedCompanyId = matched.cmp.id;
      }
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    // Get current talep data for comparison
    const currentTalep = await db.select()
      .from(talep)
      .where(
        and(
          eq(talep.id, talepId),
          eq(talep.workspaceId, resolvedWorkspace.id),
          eq(talep.companyId, resolvedCompanyId),
          isNull(talep.deletedAt)
        )
      )
      .limit(1);

    if (currentTalep.length === 0) {
      return NextResponse.json(
        { error: "Talep not found" },
        { status: 404 }
      );
    }

    // Update the talep
    const updateData: any = {
      ...validatedData,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : undefined,
      estimatedHours: validatedData.estimatedHours === null || validatedData.estimatedHours === undefined ? undefined : String(validatedData.estimatedHours),
      actualHours: validatedData.actualHours === null || validatedData.actualHours === undefined ? undefined : String(validatedData.actualHours),
      estimatedCost: validatedData.estimatedCost === null || validatedData.estimatedCost === undefined ? undefined : String(validatedData.estimatedCost),
      actualCost: validatedData.actualCost === null || validatedData.actualCost === undefined ? undefined : String(validatedData.actualCost),
      updatedBy: session.user.id,
      updatedAt: new Date(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedTalep = await db.update(talep)
      .set(updateData)
      .where(
        and(
          eq(talep.id, talepId),
          eq(talep.workspaceId, resolvedWorkspace.id),
          eq(talep.companyId, resolvedCompanyId)
        )
      )
      .returning();

    // Log activities for changes
    const current = currentTalep[0];
    const changes = [];

    if (validatedData.status && validatedData.status !== current.status) {
      changes.push({ field: 'status', old: current.status, new: validatedData.status });
    }
    if (validatedData.priority && validatedData.priority !== current.priority) {
      changes.push({ field: 'priority', old: current.priority, new: validatedData.priority });
    }
    if (validatedData.assignedTo !== undefined && validatedData.assignedTo !== current.assignedTo) {
      changes.push({ field: 'assignedTo', old: current.assignedTo, new: validatedData.assignedTo });
    }

    // Log individual activities
    for (const change of changes) {
      await logTalepActivity(
        talepId,
        'field_change',
        `${change.field} changed`,
        change.old,
        change.new,
        { field: change.field },
        session.user.id
      );
    }

    // Log general update if there were changes
    if (changes.length > 0) {
      await logTalepActivity(
        talepId,
        'updated',
        'Talep updated',
        null,
        null,
        { changes: changes.length },
        session.user.id
      );
    }

    return NextResponse.json({
      talep: updatedTalep[0],
      message: "Talep başarıyla güncellendi"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating talep:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific talep (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, talepId } = await params;

    // Resolve workspace by id or slug
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(
        or(
          eq(workspace.id, workspaceIdOrSlug),
          eq(workspace.slug, workspaceIdOrSlug)
        )
      )
      .limit(1);

    if (foundWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;

    // Try resolve by company id directly in this workspace
    const companyById = await db.select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);

    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      // Fallback: resolve by slug derived from company name (first word)
      const companiesInWorkspace = await db.select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));

      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) {
        resolvedCompanyId = matched.cmp.id;
      }
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    // Soft delete the talep
    const deletedTalep = await db.update(talep)
      .set({
        deletedAt: new Date(),
        updatedBy: session.user.id,
      })
      .where(
        and(
          eq(talep.id, talepId),
          eq(talep.workspaceId, resolvedWorkspace.id),
          eq(talep.companyId, resolvedCompanyId),
          isNull(talep.deletedAt)
        )
      )
      .returning();

    if (deletedTalep.length === 0) {
      return NextResponse.json(
        { error: "Talep not found" },
        { status: 404 }
      );
    }

    // Log deletion activity
    await logTalepActivity(
      talepId,
      'deleted',
      'Talep deleted',
      null,
      null,
      {},
      session.user.id
    );

    return NextResponse.json({
      message: "Talep başarıyla silindi"
    });

  } catch (error) {
    console.error("Error deleting talep:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
