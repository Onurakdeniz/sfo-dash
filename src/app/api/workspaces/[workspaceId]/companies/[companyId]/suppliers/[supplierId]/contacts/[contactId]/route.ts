import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supplierContact, supplier } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth/server';
import { z } from 'zod';

// Validation schemas
const updateContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional(),
  fax: z.string().optional(),
  role: z.enum(['sales_rep', 'account_manager', 'technical_support', 'purchasing', 'management', 'other']).optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

// GET /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/contacts/[contactId]
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string; supplierId: string; contactId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, companyId, supplierId, contactId } = params;

    const contactData = await db
      .select()
      .from(supplierContact)
      .where(
        and(
          eq(supplierContact.id, contactId),
          eq(supplierContact.supplierId, supplierId)
        )
      )
      .limit(1);

    if (contactData.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({ contact: contactData[0] });
  } catch (error) {
    console.error('Error fetching supplier contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/contacts/[contactId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string; supplierId: string; contactId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, companyId, supplierId, contactId } = params;
    const body = await request.json();

    const validatedData = updateContactSchema.parse(body);

    // Check if contact exists and belongs to the supplier
    const existingContact = await db
      .select()
      .from(supplierContact)
      .where(
        and(
          eq(supplierContact.id, contactId),
          eq(supplierContact.supplierId, supplierId)
        )
      )
      .limit(1);

    if (existingContact.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // If setting as primary, unset other primary contacts for this supplier
    if (validatedData.isPrimary) {
      await db
        .update(supplierContact)
        .set({ isPrimary: false })
        .where(eq(supplierContact.supplierId, supplierId));
    }

    const updatedContact = await db
      .update(supplierContact)
      .set({
        ...validatedData,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierContact.id, contactId),
          eq(supplierContact.supplierId, supplierId)
        )
      )
      .returning();

    return NextResponse.json({ contact: updatedContact[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating supplier contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/contacts/[contactId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string; supplierId: string; contactId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, companyId, supplierId, contactId } = params;

    // Check if contact exists and belongs to the supplier
    const existingContact = await db
      .select()
      .from(supplierContact)
      .where(
        and(
          eq(supplierContact.id, contactId),
          eq(supplierContact.supplierId, supplierId)
        )
      )
      .limit(1);

    if (existingContact.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Soft delete the contact
    await db
      .update(supplierContact)
      .set({
        deletedAt: new Date(),
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierContact.id, contactId),
          eq(supplierContact.supplierId, supplierId)
        )
      );

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier contact:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
