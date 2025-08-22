import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { customerAddress } from "@/db/schema";
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

    const { customerId } = await params;

    const addresses = await db.select()
      .from(customerAddress)
      .where(
        and(
          eq(customerAddress.customerId, customerId),
          eq(customerAddress.isActive, true)
        )
      )
      .orderBy(customerAddress.createdAt);

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

    const { customerId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = createAddressSchema.parse(body);

    // If setting as default, remove default from other addresses
    if (validatedData.isDefault) {
      await db.update(customerAddress)
        .set({ isDefault: false })
        .where(eq(customerAddress.customerId, customerId));
    }

    // Create the address
    const newAddress = await db.insert(customerAddress).values({
      id: randomUUID(),
      ...validatedData,
      customerId,
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
