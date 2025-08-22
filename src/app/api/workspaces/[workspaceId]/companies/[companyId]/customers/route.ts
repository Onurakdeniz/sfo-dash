import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { customer, workspace, workspaceCompany, workspaceMember, company } from "@/db/schema";
import { eq, and, or, like, desc, asc, sql, isNull } from "drizzle-orm";
import { DatabaseErrorHandler } from "@/lib/database-errors";
import { z } from "zod";
import { slugifyCompanyFirstWord } from "@/lib/slug";
import { randomUUID } from "crypto";

// Validation schema for creating/updating customers
const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(255),
  fullName: z.string().optional().nullable(),
  customerLogoUrl: z.string().optional().nullable(),
  customerType: z.enum(["individual", "corporate"]).default("individual"),
  customerCategory: z.enum(["vip", "premium", "standard", "basic", "wholesale", "retail"]).optional().nullable(),
  status: z.enum(["active", "inactive", "prospect", "lead", "suspended", "closed"]).default("active"),
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
  taxNumber: z.string().optional().nullable(), // TCKN for individuals, VKN for corporations
  mersisNumber: z.string().optional().nullable(),
  tradeRegistryNumber: z.string().optional().nullable(),

  // Financial
  defaultCurrency: z.string().length(3, "Currency must be 3 characters").default("TRY"),
  creditLimit: z.coerce.number().min(0).optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  discountRate: z.coerce.number().min(0).max(100).optional().nullable(),

  // Primary contact
  primaryContactName: z.string().optional().nullable(),
  primaryContactTitle: z.string().optional().nullable(),
  primaryContactPhone: z.string().optional().nullable(),
  primaryContactEmail: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),

  // Additional fields
  parentCustomerId: z.string().optional().nullable(),
  customerGroup: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

function normalizeCustomerBody(input: any) {
  const emptyToNull = (v: any) => (v === '' || v === undefined ? null : v);
  return {
    ...input,
    customerCategory: input?.customerCategory === 'select' ? null : emptyToNull(input?.customerCategory),
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
    customerGroup: emptyToNull(input?.customerGroup),
    notes: emptyToNull(input?.notes),
    internalNotes: emptyToNull(input?.internalNotes),
    creditLimit: input?.creditLimit === '' || input?.creditLimit === undefined ? null : input.creditLimit,
    discountRate: input?.discountRate === '' || input?.discountRate === undefined ? null : input.discountRate,
  };
}

// GET - List customers
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
    const customerType = searchParams.get('type');
    const priority = searchParams.get('priority');
    const industry = searchParams.get('industry');

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
      eq(customer.workspaceId, resolvedWorkspace.id),
      eq(customer.companyId, resolvedCompanyId),
      isNull(customer.deletedAt),
    ];

    // Apply search filter
    if (search) {
      conditions.push(
        or(
          like(customer.name, `%${search}%`),
          like(customer.email, `%${search}%`),
          like(customer.phone, `%${search}%`),
          like(customer.taxNumber, `%${search}%`),
          like(customer.primaryContactName, `%${search}%`)
        )
      );
    }

    // Treat "all" as no filter
    if (status && status !== 'all') {
      conditions.push(eq(customer.status, status as any));
    }
    if (customerType && customerType !== 'all') {
      conditions.push(eq(customer.customerType, customerType as any));
    }
    if (priority && priority !== 'all') {
      conditions.push(eq(customer.priority, priority as any));
    }
    if (industry) {
      conditions.push(eq(customer.industry, industry));
    }

    // Select fields
    const selectFields = {
      id: customer.id,
      name: customer.name,
      fullName: customer.fullName,
      customerType: customer.customerType,
      customerCategory: customer.customerCategory,
      status: customer.status,
      priority: customer.priority,
      industry: customer.industry,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      taxNumber: customer.taxNumber,
      defaultCurrency: customer.defaultCurrency,
      creditLimit: customer.creditLimit,
      paymentTerms: customer.paymentTerms,
      primaryContactName: customer.primaryContactName,
      customerGroup: customer.customerGroup,
      tags: customer.tags,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };

    const orderDirection = sortOrder === 'asc' ? asc : desc;
    let orderExpr: any = orderDirection(customer.createdAt);
    switch (sortBy) {
      case 'name':
        orderExpr = orderDirection(customer.name);
        break;
      case 'createdAt':
        orderExpr = orderDirection(customer.createdAt);
        break;
      case 'updatedAt':
        orderExpr = orderDirection(customer.updatedAt);
        break;
      case 'priority':
        orderExpr = orderDirection(customer.priority);
        break;
      default:
        orderExpr = orderDirection(customer.createdAt);
    }

    const baseSelect = db.select(selectFields).from(customer);
    const query = (baseSelect as any)
      .where(and(...conditions))
      .orderBy(orderExpr);

    // Get total count for pagination
    const totalCountQuery = await db.select({ count: sql<number>`count(*)` })
      .from(customer)
      .where(
        and(
          eq(customer.workspaceId, resolvedWorkspace.id),
          eq(customer.companyId, resolvedCompanyId),
          isNull(customer.deletedAt)
        )
      );

    // Apply pagination and execute query
    const customers = await query.limit(limit).offset(offset);
    const totalCount = totalCountQuery[0].count;

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new customer
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
    const body = normalizeCustomerBody(rawBody);

    // Validate input
    const validatedData = createCustomerSchema.parse(body);

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

    // Create the customer
    const newCustomer = await db.insert(customer).values({
      id: randomUUID(),
      ...validatedData,
      creditLimit: validatedData.creditLimit === null || validatedData.creditLimit === undefined ? null : String(validatedData.creditLimit),
      discountRate: (validatedData as any).discountRate === null || (validatedData as any).discountRate === undefined ? null : String((validatedData as any).discountRate),
      workspaceId: resolvedWorkspace.id,
      companyId: resolvedCompanyId,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning();

    return NextResponse.json({
      customer: newCustomer[0],
      message: "Customer created successfully"
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

    console.error("Error creating customer:", error);
    return NextResponse.json(
      isConstraint
        ? { error: parsed?.userMessage || 'Invalid data', code: parsed?.code, field: parsed?.field }
        : { error: 'Internal server error' },
      { status: isConstraint ? 400 : 500 }
    );
  }
}
