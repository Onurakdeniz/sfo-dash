import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supplierAddress, supplier, workspace, workspaceCompany, company } from '@/db/schema';
import { eq, and, desc, isNull, or } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { slugifyCompanyFirstWord } from '@/lib/slug';

// Validation schemas
const createAddressSchema = z.object({
  addressType: z.enum(['billing', 'shipping', 'warehouse', 'headquarters', 'branch']).default('billing'),
  title: z.string().min(1, 'Address title is required'),
  address: z.string().min(1, 'Address is required'),
  district: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  country: z.string().default('Türkiye'),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  contactName: z.string().optional().or(z.literal('')),
  contactTitle: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  isDefault: z.boolean().default(false),
});

// GET /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/addresses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; supplierId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, supplierId } = await params;

    // Resolve workspace and company
    const foundWorkspace = await db
      .select()
      .from(workspace)
      .where(or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug)))
      .limit(1);
    if (foundWorkspace.length === 0) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }
    const resolvedWorkspace = foundWorkspace[0];

    let resolvedCompanyId: string | null = null;
    const companyById = await db
      .select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
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
      if (matched) resolvedCompanyId = matched.cmp.id;
    }
    if (!resolvedCompanyId) {
      return NextResponse.json({ error: 'Company not found in this workspace' }, { status: 404 });
    }

    // Verify supplier exists and belongs to the workspace/company
    const supplierData = await db
      .select()
      .from(supplier)
      .where(
        and(
          eq(supplier.id, supplierId),
          eq(supplier.workspaceId, resolvedWorkspace.id),
          eq(supplier.companyId, resolvedCompanyId),
          isNull(supplier.deletedAt)
        )
      )
      .limit(1);

    if (supplierData.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const addresses = await db
      .select()
      .from(supplierAddress)
      .where(eq(supplierAddress.supplierId, supplierId))
      .orderBy(desc(supplierAddress.createdAt));

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching supplier addresses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/addresses
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; supplierId: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, supplierId } = await params;
    const body = await request.json();

    const validatedData = createAddressSchema.parse(body);

    // Resolve workspace and company
    const foundWorkspace = await db
      .select()
      .from(workspace)
      .where(or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug)))
      .limit(1);
    if (foundWorkspace.length === 0) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }
    const resolvedWorkspace = foundWorkspace[0];

    let resolvedCompanyId: string | null = null;
    const companyById = await db
      .select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
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
      if (matched) resolvedCompanyId = matched.cmp.id;
    }
    if (!resolvedCompanyId) {
      return NextResponse.json({ error: 'Company not found in this workspace' }, { status: 404 });
    }

    // Verify supplier exists and belongs to the workspace/company
    const supplierData = await db
      .select()
      .from(supplier)
      .where(
        and(
          eq(supplier.id, supplierId),
          eq(supplier.workspaceId, resolvedWorkspace.id),
          eq(supplier.companyId, resolvedCompanyId),
          isNull(supplier.deletedAt)
        )
      )
      .limit(1);

    if (supplierData.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // If setting as default, unset other default addresses for this supplier
    if (validatedData.isDefault) {
      await db
        .update(supplierAddress)
        .set({ isDefault: false })
        .where(eq(supplierAddress.supplierId, supplierId));
    }

    const newAddress = await db
      .insert(supplierAddress)
      .values({
        id: randomUUID(),
        supplierId,
        ...validatedData,
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning();

    return NextResponse.json(
      { address: newAddress[0] },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating supplier address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
