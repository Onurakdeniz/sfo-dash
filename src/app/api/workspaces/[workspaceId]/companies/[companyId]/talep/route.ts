import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { talep, workspace, workspaceCompany, workspaceMember, company, businessEntity, user, businessEntityContact } from "@/db/schema";
import { eq, and, or, like, desc, asc, sql, isNull, inArray } from "drizzle-orm";
import { DatabaseErrorHandler } from "@/lib/database-errors";
import { z } from "zod";
import { slugifyCompanyFirstWord } from "@/lib/slug";
import { randomUUID } from "crypto";

// Validation schema for creating/updating talep
const createTalepSchema = z.object({
  title: z.string().min(1, "Talep başlığı gerekli").max(255),
  description: z.string().min(1, "Talep açıklaması gerekli"),
  type: z.enum([
    // Defense industry specific
    "rfq",
    "rfi",
    "rfp",
    "product_inquiry",
    "price_request",
    "quotation_request",
    "order_request",
    "sample_request",
    "certification_req",
    "compliance_inquiry",
    "export_license",
    "end_user_cert",
    // Existing types
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
  ]).default("general_inquiry"),
  category: z.enum([
    // Defense industry categories
    "weapon_systems",
    "ammunition",
    "avionics",
    "radar_systems",
    "communication",
    "electronic_warfare",
    "naval_systems",
    "land_systems",
    "air_systems",
    "cyber_security",
    "simulation",
    "c4isr",
    // General categories
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
  status: z.enum(["new", "in_progress", "waiting", "resolved", "closed", "cancelled"]).default("new"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),

  // Business entity and assignment
  customerId: z.string().min(1, "Müşteri seçimi gerekli"), // Keeping customerId for backward compatibility in API
  customerContactId: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  assignedBy: z.string().optional().nullable(),

  // Contact information for this request
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email("Geçersiz email formatı").optional().or(z.literal("")).nullable(),

  // Additional details
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({}),

  // Scheduling and financial
  deadline: z.string().optional().nullable(),
  estimatedHours: z.coerce.number().min(0).optional().nullable(),
  estimatedCost: z.coerce.number().min(0).optional().nullable(),
  billingStatus: z.string().optional().nullable(),
});

function normalizeTalepBody(input: any) {
  const emptyToNull = (v: any) => (v === '' || v === undefined ? null : v);
  return {
    ...input,
    category: input?.category === 'select' ? null : emptyToNull(input?.category),
    customerContactId: emptyToNull(input?.customerContactId),
    contactName: emptyToNull(input?.contactName),
    contactPhone: emptyToNull(input?.contactPhone),
    contactEmail: emptyToNull(input?.contactEmail),
    notes: emptyToNull(input?.notes),
    deadline: input?.deadline === '' || input?.deadline === undefined ? null : input.deadline,
    estimatedHours: input?.estimatedHours === '' || input?.estimatedHours === undefined ? null : input.estimatedHours,
    estimatedCost: input?.estimatedCost === '' || input?.estimatedCost === undefined ? null : input.estimatedCost,
    billingStatus: emptyToNull(input?.billingStatus),
  };
}

// GET - List talep
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

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug } = await params;
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const customerId = searchParams.get('customerId');
    const assignedTo = searchParams.get('assignedTo');

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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
    const isOwner = resolvedWorkspace.ownerId === session.user.id;
    let userRole = 'owner';
    let userPermissions = null;
    let restrictedCompanyId = null;

    if (!isOwner) {
      // Check if user is a member of this workspace
      const membershipCheck = await db.select({
        role: workspaceMember.role,
        permissions: workspaceMember.permissions,
      })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, resolvedWorkspace.id),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      userRole = membershipCheck[0].role;
      userPermissions = membershipCheck[0].permissions;
    }

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

    // Permission: if user is restricted to a specific company, enforce it
    if (!isOwner && userPermissions) {
      try {
        let parsedPermissions: any = userPermissions;
        if (typeof userPermissions === 'string') {
          parsedPermissions = JSON.parse(userPermissions);
        }
        if (parsedPermissions && parsedPermissions.restrictedToCompany && parsedPermissions.restrictedToCompany !== resolvedCompanyId) {
          return NextResponse.json(
            { error: "Access denied - you can only access your assigned company" },
            { status: 403 }
          );
        }
      } catch (e) {
        console.error("Error parsing user permissions:", e);
      }
    }

    // Build dynamic filters
    const conditions: any[] = [
      eq(talep.workspaceId, resolvedWorkspace.id),
      eq(talep.companyId, resolvedCompanyId),
      isNull(talep.deletedAt),
    ];

    // Apply search filter
    if (search) {
      conditions.push(
        or(
          like(talep.title, `%${search}%`),
          like(talep.description, `%${search}%`),
          like(talep.contactName, `%${search}%`),
          like(talep.contactEmail, `%${search}%`),
          like(businessEntity.name, `%${search}%`),
          like(businessEntity.email, `%${search}%`)
        )
      );
    }

    // Treat "all" as no filter
    if (status && status !== 'all') {
      conditions.push(eq(talep.status, status as any));
    }
    if (type && type !== 'all') {
      conditions.push(eq(talep.type, type as any));
    }
    if (priority && priority !== 'all') {
      conditions.push(eq(talep.priority, priority as any));
    }
    if (customerId && customerId !== 'all') {
      conditions.push(eq(talep.entityId, customerId));
    }
    if (assignedTo && assignedTo !== 'all') {
      conditions.push(eq(talep.assignedTo, assignedTo));
    }

    // Select fields with business entity and user info
    const selectFields = {
      code: talep.code,
      id: talep.id,
      title: talep.title,
      description: talep.description,
      type: talep.type,
      category: talep.category,
      status: talep.status,
      priority: talep.priority,
      entityId: talep.entityId,
      entityContactId: talep.entityContactId,
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
      createdAt: talep.createdAt,
      updatedAt: talep.updatedAt,
      businessEntity: {
        id: businessEntity.id,
        name: businessEntity.name,
        fullName: businessEntity.fullName,
        email: businessEntity.email,
        phone: businessEntity.phone,
      },
      businessEntityContact: {
        id: businessEntityContact.id,
        firstName: businessEntityContact.firstName,
        lastName: businessEntityContact.lastName,
        title: businessEntityContact.title,
        email: businessEntityContact.email,
        phone: businessEntityContact.phone,
        mobile: businessEntityContact.mobile,
      },
      assignedToUser: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };

    // Determine sort field and direction
    let orderExpr: any;
    const orderDirection = sortOrder === 'asc' ? asc : desc;

    switch (sortBy) {
      case 'title':
        orderExpr = orderDirection(talep.title);
        break;
      case 'customer':
        orderExpr = orderDirection(businessEntity.name);
        break;
      case 'priority':
        orderExpr = orderDirection(talep.priority);
        break;
      case 'type':
        orderExpr = orderDirection(talep.type);
        break;
      case 'status':
        orderExpr = orderDirection(talep.status);
        break;
      default:
        orderExpr = orderDirection(talep.createdAt);
    }

    const baseSelect = db.select(selectFields)
      .from(talep)
      .leftJoin(businessEntity, eq(talep.entityId, businessEntity.id))
      .leftJoin(businessEntityContact, eq(talep.entityContactId, businessEntityContact.id))
      .leftJoin(user, eq(talep.assignedTo, user.id));

    const query = (baseSelect as any)
      .where(and(...conditions))
      .orderBy(orderExpr);

    // Get total count for pagination
    const totalCountQuery = await db.select({ count: sql<number>`count(*)` })
      .from(talep)
      .where(
        and(
          eq(talep.workspaceId, resolvedWorkspace.id),
          eq(talep.companyId, resolvedCompanyId),
          isNull(talep.deletedAt)
        )
      );

    // Apply pagination and execute query
    const talepler = await query.limit(limit).offset(offset);
    const totalCount = totalCountQuery[0].count;

    return NextResponse.json({
      talepler,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error("Error fetching talepler:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new talep
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

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug } = await params;
    const rawBody = await request.json();
    const body = normalizeTalepBody(rawBody);

    // Validate input
    const validatedData = createTalepSchema.parse(body);

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
    const isOwner = resolvedWorkspace.ownerId === session.user.id;
    let userRole = 'owner';
    let userPermissions = null;

    if (!isOwner) {
      // Check if user is a member of this workspace
      const membershipCheck = await db.select({
        role: workspaceMember.role,
        permissions: workspaceMember.permissions,
      })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, resolvedWorkspace.id),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      userRole = membershipCheck[0].role;
      userPermissions = membershipCheck[0].permissions;
    }

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

    // Permission: if user is restricted to a specific company, enforce it
    if (!isOwner && userPermissions) {
      try {
        let parsedPermissions: any = userPermissions;
        if (typeof userPermissions === 'string') {
          parsedPermissions = JSON.parse(userPermissions);
        }
        if (parsedPermissions && parsedPermissions.restrictedToCompany && parsedPermissions.restrictedToCompany !== resolvedCompanyId) {
          return NextResponse.json(
            { error: "Access denied - you can only access your assigned company" },
            { status: 403 }
          );
        }
      } catch (e) {
        console.error("Error parsing user permissions:", e);
      }
    }

    // Verify business entity exists and belongs to the same workspace/company
    const entityCheck = await db.select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, validatedData.customerId),
          eq(businessEntity.workspaceId, resolvedWorkspace.id),
          eq(businessEntity.companyId, resolvedCompanyId)
        )
      )
      .limit(1);

    if (entityCheck.length === 0) {
      return NextResponse.json(
        { error: "Business entity not found or access denied" },
        { status: 404 }
      );
    }

    // Create the talep with generated human-friendly code (e.g., TLP-12345)
    async function generateTalepCode(): Promise<string> {
      for (let i = 0; i < 10; i++) {
        const num = Math.floor(10000 + Math.random() * 90000);
        const code = `TLP-${num}`;
        const rows = await db.select({ count: sql<number>`count(*)` }).from(talep).where(eq(talep.code, code));
        const count = rows?.[0]?.count ?? 0;
        if (Number(count) === 0) return code;
      }
      return `TLP-${Date.now().toString().slice(-5)}`;
    }

    const tlpCode = await generateTalepCode();

    const newTalep = await db.insert(talep).values({
      id: randomUUID(),
      code: tlpCode,
      title: validatedData.title,
      description: validatedData.description,
      type: validatedData.type,
      category: validatedData.category,
      status: validatedData.status,
      priority: validatedData.priority,
      entityId: validatedData.customerId, // Map customerId to entityId for the database
      entityContactId: validatedData.customerContactId,
      assignedTo: validatedData.assignedTo,
      assignedBy: validatedData.assignedBy,
      contactName: validatedData.contactName,
      contactPhone: validatedData.contactPhone,
      contactEmail: validatedData.contactEmail,
      tags: validatedData.tags,
      metadata: validatedData.metadata,
      deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
      estimatedHours: validatedData.estimatedHours === null || validatedData.estimatedHours === undefined ? null : validatedData.estimatedHours,
      estimatedCost: validatedData.estimatedCost === null || validatedData.estimatedCost === undefined ? null : validatedData.estimatedCost,
      billingStatus: validatedData.billingStatus,
      workspaceId: resolvedWorkspace.id,
      companyId: resolvedCompanyId,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning();

    return NextResponse.json({
      talep: newTalep[0],
      message: "Talep başarıyla oluşturuldu"
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    // Map DB constraint violations and known DB errors to user-friendly 400s
    const parsed = DatabaseErrorHandler.parseError(error);
    const isConstraint = DatabaseErrorHandler.isConstraintViolation(error);

    console.error("Error creating talep:", error);
    return NextResponse.json(
      isConstraint
        ? { error: parsed?.userMessage || 'Invalid data', code: parsed?.code, field: parsed?.field }
        : { error: 'Internal server error' },
      { status: isConstraint ? 400 : 500 }
    );
  }
}
