import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supplier, workspace, workspaceCompany, company } from '@/db/schema';
import { eq, and, isNull, ne, or } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth/server';
import { z } from 'zod';
import { slugifyCompanyFirstWord } from '@/lib/slug';

// Validation schemas
const updateSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').optional(),
  fullName: z.string().optional(),
  supplierType: z.enum(['individual', 'corporate']).optional(),
  supplierCategory: z.enum(['strategic', 'preferred', 'approved', 'standard', 'new', 'temporary']).optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'suspended', 'blacklisted', 'closed']).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  fax: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  country: z.string().optional(),
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

// GET /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]
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

    return NextResponse.json({ supplier: supplierData[0] });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]
export async function PUT(
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

    const validatedData = updateSupplierSchema.parse(body);

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

    // Check if supplier exists and belongs to the workspace/company
    const existingSupplier = await db
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

    if (existingSupplier.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Check if supplier code already exists for this workspace/company (excluding current supplier)
    if (validatedData.supplierCode) {
      const duplicateCode = await db
        .select()
        .from(supplier)
        .where(
          and(
            eq(supplier.workspaceId, workspaceId),
            eq(supplier.companyId, companyId),
            eq(supplier.supplierCode, validatedData.supplierCode),
            isNull(supplier.deletedAt),
            ne(supplier.id, supplierId)
          )
        )
        .limit(1);

      if (duplicateCode.length > 0) {
        return NextResponse.json(
          { error: 'Supplier code already exists' },
          { status: 400 }
        );
      }
    }

    const updatedSupplier = await db
      .update(supplier)
      .set({
        ...validatedData,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplier.id, supplierId),
          eq(supplier.workspaceId, resolvedWorkspace.id),
          eq(supplier.companyId, resolvedCompanyId)
        )
      )
      .returning();

    return NextResponse.json({ supplier: updatedSupplier[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]
export async function DELETE(
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

    // Check if supplier exists and belongs to the workspace/company
    const existingSupplier = await db
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

    if (existingSupplier.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Soft delete the supplier
    await db
      .update(supplier)
      .set({
        deletedAt: new Date(),
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplier.id, supplierId),
          eq(supplier.workspaceId, resolvedWorkspace.id),
          eq(supplier.companyId, resolvedCompanyId)
        )
      );

    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
