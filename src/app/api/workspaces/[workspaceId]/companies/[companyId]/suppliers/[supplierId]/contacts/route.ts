import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supplierContact, supplier, workspace, workspaceCompany, company } from '@/db/schema';
import { eq, and, desc, isNull, or } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { slugifyCompanyFirstWord } from '@/lib/slug';

// Validation schemas
type CompanySelect = typeof company.$inferSelect;
const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  fax: z.string().optional().or(z.literal('')),
  role: z.enum(['sales_rep', 'account_manager', 'technical_support', 'purchasing', 'management', 'other']).optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional().or(z.literal('')),
});

// GET /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/contacts
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
      const companiesInWorkspace: Array<{ cmp: CompanySelect }> = await db
        .select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));
      const matched = companiesInWorkspace.find((row) =>
        slugifyCompanyFirstWord(row.cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase()
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

    const contacts = await db
      .select()
      .from(supplierContact)
      .where(eq(supplierContact.supplierId, supplierId))
      .orderBy(desc(supplierContact.createdAt));

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error fetching supplier contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/contacts
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

    const validatedData = createContactSchema.parse(body);

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
      const companiesInWorkspace: Array<{ cmp: CompanySelect }> = await db
        .select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));
      const matched = companiesInWorkspace.find((row) =>
        slugifyCompanyFirstWord(row.cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase()
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

    // If setting as primary, unset other primary contacts for this supplier
    if (validatedData.isPrimary) {
      await db
        .update(supplierContact)
        .set({ isPrimary: false })
        .where(eq(supplierContact.supplierId, supplierId));
    }

    const newContact = await db
      .insert(supplierContact)
      .values({
        id: randomUUID(),
        supplierId,
        ...validatedData,
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning();

    return NextResponse.json(
      { contact: newContact[0] },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating supplier contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}