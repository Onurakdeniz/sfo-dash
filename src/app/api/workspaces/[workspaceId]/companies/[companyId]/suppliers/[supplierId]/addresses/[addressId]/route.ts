import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { businessEntityAddress, businessEntity } from '@/db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth/server';
import { z } from 'zod';

// Validation schemas
const updateAddressSchema = z.object({
  addressType: z.enum(['billing', 'shipping', 'warehouse', 'headquarters', 'branch']).optional(),
  title: z.string().min(1, 'Address title is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  district: z.string().optional().nullable().transform(val => val === '' ? null : val),
  city: z.string().optional().nullable().transform(val => val === '' ? null : val),
  postalCode: z.string().optional().nullable().transform(val => val === '' ? null : val),
  country: z.string().optional(),
  phone: z.string().optional().nullable().transform(val => val === '' ? null : val),
  email: z.union([
    z.string().email("Invalid email"),
    z.literal(''),
    z.null()
  ]).optional().nullable().transform(val => (val === '' || val === null) ? null : val),
  contactName: z.string().optional().nullable().transform(val => val === '' ? null : val),
  contactTitle: z.string().optional().nullable().transform(val => val === '' ? null : val),
  notes: z.string().optional().nullable().transform(val => val === '' ? null : val),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/addresses/[addressId]
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string; supplierId: string; addressId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, companyId, supplierId, addressId } = params;

    // Verify supplier (business entity) exists
    const supplierData = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, supplierId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          or(
            eq(businessEntity.entityType, 'supplier'),
            eq(businessEntity.entityType, 'both')
          ),
          isNull(businessEntity.deletedAt)
        )
      )
      .limit(1);

    if (supplierData.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const addressData = await db
      .select()
      .from(businessEntityAddress)
      .where(
        and(
          eq(businessEntityAddress.id, addressId),
          eq(businessEntityAddress.entityId, supplierId)
        )
      )
      .limit(1);

    if (addressData.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ address: addressData[0] });
  } catch (error) {
    console.error('Error fetching supplier address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/addresses/[addressId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string; supplierId: string; addressId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, companyId, supplierId, addressId } = params;
    const body = await request.json();

    const validatedData = updateAddressSchema.parse(body);

    // Verify supplier (business entity) exists
    const supplierData = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, supplierId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          or(
            eq(businessEntity.entityType, 'supplier'),
            eq(businessEntity.entityType, 'both')
          ),
          isNull(businessEntity.deletedAt)
        )
      )
      .limit(1);

    if (supplierData.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Check if address exists and belongs to the supplier
    const existingAddress = await db
      .select()
      .from(businessEntityAddress)
      .where(
        and(
          eq(businessEntityAddress.id, addressId),
          eq(businessEntityAddress.entityId, supplierId)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If setting as default, unset other default addresses for this supplier
    if (validatedData.isDefault) {
      await db
        .update(businessEntityAddress)
        .set({ isDefault: false })
        .where(eq(businessEntityAddress.entityId, supplierId));
    }

    const updatedAddress = await db
      .update(businessEntityAddress)
      .set({
        ...validatedData,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(businessEntityAddress.id, addressId),
          eq(businessEntityAddress.entityId, supplierId)
        )
      )
      .returning();

    return NextResponse.json({ address: updatedAddress[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating supplier address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId]/companies/[companyId]/suppliers/[supplierId]/addresses/[addressId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string; supplierId: string; addressId: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId, companyId, supplierId, addressId } = params;

    // Verify supplier (business entity) exists
    const supplierData = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, supplierId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          or(
            eq(businessEntity.entityType, 'supplier'),
            eq(businessEntity.entityType, 'both')
          ),
          isNull(businessEntity.deletedAt)
        )
      )
      .limit(1);

    if (supplierData.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Check if address exists and belongs to the supplier
    const existingAddress = await db
      .select()
      .from(businessEntityAddress)
      .where(
        and(
          eq(businessEntityAddress.id, addressId),
          eq(businessEntityAddress.entityId, supplierId)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Soft delete the address
    await db
      .update(businessEntityAddress)
      .set({
        deletedAt: new Date(),
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(businessEntityAddress.id, addressId),
          eq(businessEntityAddress.entityId, supplierId)
        )
      );

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
