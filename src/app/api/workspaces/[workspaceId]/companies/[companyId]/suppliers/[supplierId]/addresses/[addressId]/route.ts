import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { supplierAddress, supplier } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserFromRequest } from '@/lib/auth/server';
import { z } from 'zod';

// Validation schemas
const updateAddressSchema = z.object({
  addressType: z.enum(['billing', 'shipping', 'warehouse', 'headquarters', 'branch']).optional(),
  title: z.string().min(1, 'Address title is required').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  notes: z.string().optional(),
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

    const addressData = await db
      .select()
      .from(supplierAddress)
      .where(
        and(
          eq(supplierAddress.id, addressId),
          eq(supplierAddress.supplierId, supplierId)
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

    // Check if address exists and belongs to the supplier
    const existingAddress = await db
      .select()
      .from(supplierAddress)
      .where(
        and(
          eq(supplierAddress.id, addressId),
          eq(supplierAddress.supplierId, supplierId)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If setting as default, unset other default addresses for this supplier
    if (validatedData.isDefault) {
      await db
        .update(supplierAddress)
        .set({ isDefault: false })
        .where(eq(supplierAddress.supplierId, supplierId));
    }

    const updatedAddress = await db
      .update(supplierAddress)
      .set({
        ...validatedData,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierAddress.id, addressId),
          eq(supplierAddress.supplierId, supplierId)
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

    // Check if address exists and belongs to the supplier
    const existingAddress = await db
      .select()
      .from(supplierAddress)
      .where(
        and(
          eq(supplierAddress.id, addressId),
          eq(supplierAddress.supplierId, supplierId)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Soft delete the address
    await db
      .update(supplierAddress)
      .set({
        deletedAt: new Date(),
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierAddress.id, addressId),
          eq(supplierAddress.supplierId, supplierId)
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
