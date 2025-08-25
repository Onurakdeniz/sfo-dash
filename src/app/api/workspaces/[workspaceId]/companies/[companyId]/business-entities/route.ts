import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { businessEntity, workspace, workspaceCompany, workspaceMember, company } from "@/db/schema";
import { eq, and, or, like, desc, asc, sql, isNull } from "drizzle-orm";
import { DatabaseErrorHandler } from "@/lib/database-errors";
import { z } from "zod";
import { randomUUID } from "crypto";

// Validation schema for creating/updating business entities
const createBusinessEntitySchema = z.object({
  entityType: z.enum(["customer", "supplier", "both"]),
  name: z.string().min(1, "Entity name is required").max(255),
  fullName: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  entityCategory: z.enum(["vip", "premium", "standard", "basic", "wholesale", "retail", "strategic", "preferred", "approved", "probation"]).optional().nullable(),
  businessType: z.enum(["company", "individual", "government"]).default("company"),
  status: z.enum(["active", "inactive", "prospect", "lead", "suspended", "closed", "blocked"]).default("active"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  industry: z.string().optional().nullable(),

  // Contact information
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")).nullable(),
  fax: z.string().optional().nullable(),

  // Address
  address: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().default("Türkiye"),

  // Turkish business identifiers
  taxOffice: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  mersisNumber: z.string().optional().nullable(),
  tradeRegistryNumber: z.string().optional().nullable(),

  // Financial
  defaultCurrency: z.string().length(3, "Currency must be 3 characters").default("TRY"),
  creditLimit: z.coerce.number().min(0).optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  discountRate: z.coerce.number().min(0).max(100).optional().nullable(),

  // Business entity codes
  entityCode: z.string().optional().nullable(),
  supplierCode: z.string().optional().nullable(),
  customerCode: z.string().optional().nullable(),

  // Supplier specific fields
  leadTimeDays: z.coerce.number().min(0).optional().nullable(),
  minimumOrderQuantity: z.coerce.number().min(0).optional().nullable(),
  orderIncrement: z.coerce.number().min(0).optional().nullable(),
  qualityRating: z.coerce.number().min(0).max(5).optional().nullable(),
  deliveryRating: z.coerce.number().min(0).max(5).optional().nullable(),

  // Defense industry specific
  defenseContractor: z.boolean().default(false),
  exportLicense: z.boolean().default(false),
  securityClearance: z.string().optional().nullable(),
  certifications: z.array(z.any()).default([]),

  // Primary contact
  primaryContactName: z.string().optional().nullable(),
  primaryContactTitle: z.string().optional().nullable(),
  primaryContactPhone: z.string().optional().nullable(),
  primaryContactEmail: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),

  // Additional fields
  parentEntityId: z.string().optional().nullable(),
  entityGroup: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

function normalizeEntityBody(input: any) {
  const emptyToNull = (v: any) => (v === '' || v === undefined ? null : v);
  return {
    ...input,
    entityCategory: input?.entityCategory === 'select' ? null : emptyToNull(input?.entityCategory),
    phone: emptyToNull(input?.phone),
    email: emptyToNull(input?.email),
    website: emptyToNull(input?.website),
    fax: emptyToNull(input?.fax),
    address: emptyToNull(input?.address),
    district: emptyToNull(input?.district),
    city: emptyToNull(input?.city),
    postalCode: emptyToNull(input?.postalCode),
    taxOffice: emptyToNull(input?.taxOffice),
    taxNumber: emptyToNull(input?.taxNumber),
    mersisNumber: emptyToNull(input?.mersisNumber),
    tradeRegistryNumber: emptyToNull(input?.tradeRegistryNumber),
    paymentTerms: emptyToNull(input?.paymentTerms),
    primaryContactName: emptyToNull(input?.primaryContactName),
    primaryContactTitle: emptyToNull(input?.primaryContactTitle),
    primaryContactPhone: emptyToNull(input?.primaryContactPhone),
    primaryContactEmail: emptyToNull(input?.primaryContactEmail),
    entityGroup: emptyToNull(input?.entityGroup),
    notes: emptyToNull(input?.notes),
    internalNotes: emptyToNull(input?.internalNotes),
    creditLimit: input?.creditLimit === '' || input?.creditLimit === undefined ? null : input.creditLimit,
    discountRate: input?.discountRate === '' || input?.discountRate === undefined ? null : input.discountRate,
    leadTimeDays: input?.leadTimeDays === '' || input?.leadTimeDays === undefined ? null : input.leadTimeDays,
    minimumOrderQuantity: input?.minimumOrderQuantity === '' || input?.minimumOrderQuantity === undefined ? null : input.minimumOrderQuantity,
    orderIncrement: input?.orderIncrement === '' || input?.orderIncrement === undefined ? null : input.orderIncrement,
    qualityRating: input?.qualityRating === '' || input?.qualityRating === undefined ? null : input.qualityRating,
    deliveryRating: input?.deliveryRating === '' || input?.deliveryRating === undefined ? null : input.deliveryRating,
  };
}

// GET - List business entities
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Check workspace membership
    const membership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Check if company belongs to workspace
    const companyCheck = await db
      .select()
      .from(workspaceCompany)
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(workspaceCompany.companyId, companyId)
        )
      )
      .limit(1);

    if (companyCheck.length === 0) {
      return NextResponse.json({ error: "Company not found in workspace" }, { status: 404 });
    }

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const status = searchParams.get("status");
    const entityType = searchParams.get("entityType"); // 'customer', 'supplier', 'both', or null for all
    const entityCategory = searchParams.get("entityCategory");
    const priority = searchParams.get("priority");

    // Build where conditions
    const conditions = [
      eq(businessEntity.workspaceId, workspaceId),
      eq(businessEntity.companyId, companyId),
      isNull(businessEntity.deletedAt)
    ];

    // Filter by entity type
    if (entityType === 'customer') {
      conditions.push(
        or(
          eq(businessEntity.entityType, 'customer'),
          eq(businessEntity.entityType, 'both')
        )!
      );
    } else if (entityType === 'supplier') {
      conditions.push(
        or(
          eq(businessEntity.entityType, 'supplier'),
          eq(businessEntity.entityType, 'both')
        )!
      );
    } else if (entityType === 'both') {
      conditions.push(eq(businessEntity.entityType, 'both'));
    }

    if (status) {
      conditions.push(eq(businessEntity.status, status as any));
    }

    if (entityCategory) {
      conditions.push(eq(businessEntity.entityCategory, entityCategory as any));
    }

    if (priority) {
      conditions.push(eq(businessEntity.priority, priority));
    }

    if (search) {
      conditions.push(
        or(
          like(businessEntity.name, `%${search}%`),
          like(businessEntity.fullName, `%${search}%`),
          like(businessEntity.email, `%${search}%`),
          like(businessEntity.phone, `%${search}%`),
          like(businessEntity.taxNumber, `%${search}%`),
          like(businessEntity.entityCode, `%${search}%`),
          like(businessEntity.supplierCode, `%${search}%`),
          like(businessEntity.customerCode, `%${search}%`)
        )!
      );
    }

    // Execute query with pagination
    const offset = (page - 1) * limit;

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessEntity)
      .where(and(...conditions));

    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get entities
    let query = db
      .select()
      .from(businessEntity)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    // Apply sorting
    if (sortBy && sortOrder) {
      const column = businessEntity[sortBy as keyof typeof businessEntity];
      if (column) {
        query = query.orderBy(
          sortOrder === "asc" ? asc(column) : desc(column)
        );
      }
    }

    const entities = await query;

    return NextResponse.json({
      data: entities,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching business entities:", error);
    return DatabaseErrorHandler.handle(error);
  }
}

// POST - Create business entity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId } = await params;
    const body = await request.json();

    // Check workspace membership
    const membership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Check if company belongs to workspace
    const companyCheck = await db
      .select()
      .from(workspaceCompany)
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(workspaceCompany.companyId, companyId)
        )
      )
      .limit(1);

    if (companyCheck.length === 0) {
      return NextResponse.json({ error: "Company not found in workspace" }, { status: 404 });
    }

    // Normalize and validate the request body
    const normalizedBody = normalizeEntityBody(body);
    const validatedData = createBusinessEntitySchema.parse(normalizedBody);

    // Check for duplicate entity codes if provided
    if (validatedData.entityCode) {
      const existingCode = await db
        .select()
        .from(businessEntity)
        .where(
          and(
            eq(businessEntity.workspaceId, workspaceId),
            eq(businessEntity.companyId, companyId),
            eq(businessEntity.entityCode, validatedData.entityCode),
            isNull(businessEntity.deletedAt)
          )
        )
        .limit(1);

      if (existingCode.length > 0) {
        return NextResponse.json(
          { error: "Entity code already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate supplier code if provided and entity type includes supplier
    if (validatedData.supplierCode && (validatedData.entityType === 'supplier' || validatedData.entityType === 'both')) {
      const existingSupplierCode = await db
        .select()
        .from(businessEntity)
        .where(
          and(
            eq(businessEntity.workspaceId, workspaceId),
            eq(businessEntity.companyId, companyId),
            eq(businessEntity.supplierCode, validatedData.supplierCode),
            isNull(businessEntity.deletedAt)
          )
        )
        .limit(1);

      if (existingSupplierCode.length > 0) {
        return NextResponse.json(
          { error: "Supplier code already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate customer code if provided and entity type includes customer
    if (validatedData.customerCode && (validatedData.entityType === 'customer' || validatedData.entityType === 'both')) {
      const existingCustomerCode = await db
        .select()
        .from(businessEntity)
        .where(
          and(
            eq(businessEntity.workspaceId, workspaceId),
            eq(businessEntity.companyId, companyId),
            eq(businessEntity.customerCode, validatedData.customerCode),
            isNull(businessEntity.deletedAt)
          )
        )
        .limit(1);

      if (existingCustomerCode.length > 0) {
        return NextResponse.json(
          { error: "Customer code already exists" },
          { status: 400 }
        );
      }
    }

    // Create the business entity
    const newEntity = await db
      .insert(businessEntity)
      .values({
        id: randomUUID(),
        workspaceId,
        companyId,
        ...validatedData,
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json({
      data: newEntity[0],
      message: `Business entity created successfully as ${validatedData.entityType}`
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating business entity:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return DatabaseErrorHandler.handle(error);
  }
}