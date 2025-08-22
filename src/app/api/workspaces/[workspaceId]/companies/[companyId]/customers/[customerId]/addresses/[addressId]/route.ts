import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerAddress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateAddressSchema = z.object({
  addressType: z.string().optional(),
  title: z.string().optional().nullable(),
  address: z.string().optional(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactTitle: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string; addressId: string }> }
) {
  try {
    const { addressId, customerId } = await params;
    const body = await request.json();
    const data = updateAddressSchema.parse(body);

    // If setting as default, unset other defaults for this customer
    if (data.isDefault === true) {
      await db.update(customerAddress)
        .set({ isDefault: false })
        .where(eq(customerAddress.customerId, customerId));
    }

    const [updated] = await db.update(customerAddress)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customerAddress.id, addressId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address: updated, message: "Address updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string; addressId: string }> }
) {
  try {
    const { addressId } = await params;

    const [deleted] = await db
      .delete(customerAddress)
      .where(eq(customerAddress.id, addressId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


