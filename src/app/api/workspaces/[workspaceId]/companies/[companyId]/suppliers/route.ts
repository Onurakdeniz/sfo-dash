import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supplier, supplierAddress, supplierContact, supplierFile, supplierNote, workspace, workspaceCompany, company } from '@/db/schema';
import { eq, and, desc, ilike, or, isNull } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth/server';
import { z } from 'zod';
import { slugifyCompanyFirstWord } from '@/lib/slug';

// Validation schemas
const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  fullName: z.string().optional(),
  supplierType: z.enum(['individual', 'corporate']),
  supplierCategory: z.enum(['strategic', 'preferred', 'approved', 'standard', 'new', 'temporary']).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  fax: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  country: z.string().default('Türkiye'),
  taxOffice: z.string().optional().or(z.literal('')),
  taxNumber: z.string().optional().or(z.literal('')),
  mersisNumber: z.string().optional().or(z.literal('')),
  tradeRegistryNumber: z.string().optional().or(z.literal('')),
  supplierCode: z.string().optional().or(z.literal('')),
  leadTimeDays: z.number().optional(),
  minimumOrderQuantity: z.number().optional(),
  orderIncrement: z.number().optional(),
  primaryContactName: z.string().optional().or(z.literal('')),
  primaryContactTitle: z.string().optional().or(z.literal('')),
  primaryContactPhone: z.string().optional().or(z.literal('')),
  primaryContactEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

const updateSupplierSchema = createSupplierSchema.partial();

// GET /api/workspaces/[workspaceId]/companies/[companyId]/suppliers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    // Resolve workspace by id or slug
    const foundWorkspace = await db
      .select()
      .from(workspace)
      .where(
        or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug))
      )
      .limit(1);

    if (foundWorkspace.length === 0) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;

    const companyById = await db
      .select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(
        and(
          eq(workspaceCompany.workspaceId, resolvedWorkspace.id),
          eq(company.id, companyIdOrSlug)
        )
      )
      .limit(1);

    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      const companiesInWorkspace = await db
        .select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));

      const matched = companiesInWorkspace.find(({ cmp }) =>
        slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase()
      );
      if (matched) {
        resolvedCompanyId = matched.cmp.id;
      }
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: 'Company not found in this workspace' },
        { status: 404 }
      );
    }

    const conditions: any[] = [
      eq(supplier.workspaceId, resolvedWorkspace.id),
      eq(supplier.companyId, resolvedCompanyId),
      isNull(supplier.deletedAt),
    ];

    if (search) {
      conditions.push(
        or(
          ilike(supplier.name, `%${search}%`),
          ilike(supplier.email, `%${search}%`),
          ilike(supplier.phone, `%${search}%`),
          ilike(supplier.supplierCode, `%${search}%`)
        )
      );
    }

    if (status && status !== 'all') {
      conditions.push(eq(supplier.status, status as any));
    }

    if (type && type !== 'all') {
      conditions.push(eq(supplier.supplierType, type as any));
    }

    if (category && category !== 'all') {
      conditions.push(eq(supplier.supplierCategory, category as any));
    }

    const suppliers = await db
      .select({
        id: supplier.id,
        name: supplier.name,
        fullName: supplier.fullName,
        supplierType: supplier.supplierType,
        supplierCategory: supplier.supplierCategory,
        status: supplier.status,
        email: supplier.email,
        phone: supplier.phone,
        city: supplier.city,
        supplierCode: supplier.supplierCode,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      })
      .from(supplier)
      .where(and(...conditions))
      .orderBy(desc(supplier.createdAt));

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/companies/[companyId]/suppliers
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug } = await params;
    const body = await request.json();

    const validatedData = createSupplierSchema.parse(body);

    // Resolve workspace by id or slug
    const foundWorkspace = await db
      .select()
      .from(workspace)
      .where(
        or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug))
      )
      .limit(1);

    if (foundWorkspace.length === 0) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;

    const companyById = await db
      .select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(
        and(
          eq(workspaceCompany.workspaceId, resolvedWorkspace.id),
          eq(company.id, companyIdOrSlug)
        )
      )
      .limit(1);

    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      const companiesInWorkspace = await db
        .select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));

      const matched = companiesInWorkspace.find(({ cmp }) =>
        slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase()
      );
      if (matched) {
        resolvedCompanyId = matched.cmp.id;
      }
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: 'Company not found in this workspace' },
        { status: 404 }
      );
    }

    // Check if supplier code already exists for this workspace/company
    if (validatedData.supplierCode) {
      const existingSupplier = await db
        .select()
        .from(supplier)
        .where(
          and(
            eq(supplier.workspaceId, resolvedWorkspace.id),
            eq(supplier.companyId, resolvedCompanyId),
            eq(supplier.supplierCode, validatedData.supplierCode),
            isNull(supplier.deletedAt)
          )
        )
        .limit(1);

      if (existingSupplier.length > 0) {
        return NextResponse.json(
          { error: 'Supplier code already exists' },
          { status: 400 }
        );
      }
    }

    const newSupplier = await db
      .insert(supplier)
      .values({
        workspaceId: resolvedWorkspace.id,
        companyId: resolvedCompanyId,
        ...validatedData,
        status: validatedData.status || 'active',
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning();

    return NextResponse.json(
      { supplier: newSupplier[0] },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
