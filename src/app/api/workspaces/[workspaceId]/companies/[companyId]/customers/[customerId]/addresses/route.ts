import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { businessEntityAddress, businessEntity } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

// Validation schema for addresses
const createAddressSchema = z.object({
  addressType: z.string().min(1, "Address type is required"),
  title: z.string().optional().nullable(),
  address: z.string().min(1, "Address is required"),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactTitle: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// GET - List customer addresses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, workspaceId, companyId } = await params;

    // First check if the customer (business entity) exists
    const entity = await db.select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, customerId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId)
        )
      )
      .limit(1);

    if (!entity.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const addresses = await db.select()
      .from(businessEntityAddress)
      .where(
        and(
          eq(businessEntityAddress.entityId, customerId),
          eq(businessEntityAddress.isActive, true)
        )
      )
      .orderBy(businessEntityAddress.createdAt);

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new address
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, workspaceId, companyId } = await params;
    const body = await request.json();

    // First check if the customer (business entity) exists
    const entity = await db.select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, customerId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId)
        )
      )
      .limit(1);

    if (!entity.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Validate input
    const validatedData = createAddressSchema.parse(body);

    // If setting as default, remove default from other addresses
    if (validatedData.isDefault) {
      await db.update(businessEntityAddress)
        .set({ isDefault: false })
        .where(eq(businessEntityAddress.entityId, customerId));
    }

    // Create the address
    const newAddress = await db.insert(businessEntityAddress).values({
      id: randomUUID(),
      ...validatedData,
      entityId: customerId,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning();

    return NextResponse.json({
      address: newAddress[0],
      message: "Address created successfully"
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
