import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { talep, talepProduct, workspace, workspaceCompany, workspaceMember, company } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

// Schema for creating/updating talep products
const talepProductSchema = z.object({
  productCode: z.string().optional().nullable(),
  productName: z.string().min(1, "Product name is required").max(255),
  productDescription: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  partNumber: z.string().optional().nullable(),
  specifications: z.record(z.any()).optional().nullable(),
  category: z.string().optional().nullable(),
  subCategory: z.string().optional().nullable(),
  requestedQuantity: z.number().int().min(1).default(1),
  unitOfMeasure: z.string().default("piece"),
  targetPrice: z.number().optional().nullable(),
  currency: z.string().length(3).default("USD"),
  exportControlled: z.boolean().default(false),
  itar: z.boolean().default(false),
  endUseStatement: z.string().optional().nullable(),
  certificationRequired: z.array(z.string()).optional().nullable(),
  status: z.string().default("requested"),
  notes: z.string().optional().nullable(),
});

// GET - List talep products
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, talepId } = await params;

    // Verify access to the talep
    const talepCheck = await db.select()
      .from(talep)
      .where(eq(talep.id, talepId))
      .limit(1);

    if (talepCheck.length === 0) {
      return NextResponse.json(
        { error: "Talep not found" },
        { status: 404 }
      );
    }

    // Get products for this talep
    const products = await db.select()
      .from(talepProduct)
      .where(eq(talepProduct.talepId, talepId))
      .orderBy(talepProduct.createdAt);

    return NextResponse.json({
      products,
      count: products.length
    });

  } catch (error) {
    console.error("Error fetching talep products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add product to talep
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, talepId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = talepProductSchema.parse(body);

    // Verify access to the talep
    const talepCheck = await db.select()
      .from(talep)
      .where(eq(talep.id, talepId))
      .limit(1);

    if (talepCheck.length === 0) {
      return NextResponse.json(
        { error: "Talep not found" },
        { status: 404 }
      );
    }

    // Create the product
    const newProduct = await db.insert(talepProduct).values({
      id: randomUUID(),
      talepId,
      ...validatedData,
      targetPrice: validatedData.targetPrice ? String(validatedData.targetPrice) : null,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning();

    return NextResponse.json({
      product: newProduct[0],
      message: "Product added successfully"
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating talep product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}