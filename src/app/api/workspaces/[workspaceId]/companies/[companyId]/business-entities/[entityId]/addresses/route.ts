import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { businessEntity, businessEntityAddress, workspaceMember } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { DatabaseErrorHandler } from "@/lib/database-errors";
import { z } from "zod";
import { randomUUID } from "crypto";

// Validation schema for creating/updating addresses
const addressSchema = z.object({
  addressType: z.enum(["billing", "shipping", "warehouse", "office", "other"]).default("billing"),
  title: z.string().optional().nullable(),
  address: z.string().min(1, "Address is required"),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().default("Türkiye"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),
  contactName: z.string().optional().nullable(),
  contactTitle: z.string().optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({})
});

// GET - List addresses for a business entity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; entityId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, entityId } = await params;

    // Check workspace membership
    const membership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Check if entity exists
    const [entity] = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, entityId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          isNull(businessEntity.deletedAt)
        )
      )
      .limit(1);

    if (!entity) {
      return NextResponse.json({ error: "Business entity not found" }, { status: 404 });
    }

    // Get addresses
    const addresses = await db
      .select()
      .from(businessEntityAddress)
      .where(
        and(
          eq(businessEntityAddress.entityId, entityId),
          isNull(businessEntityAddress.deletedAt)
        )
      )
      .orderBy(businessEntityAddress.isDefault, businessEntityAddress.createdAt);

    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return DatabaseErrorHandler.handle(error);
  }
}

// POST - Create a new address for a business entity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; entityId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, entityId } = await params;
    const body = await request.json();

    // Check workspace membership
    const membership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Check if entity exists
    const [entity] = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, entityId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          isNull(businessEntity.deletedAt)
        )
      )
      .limit(1);

    if (!entity) {
      return NextResponse.json({ error: "Business entity not found" }, { status: 404 });
    }

    // Validate the request body
    const validatedData = addressSchema.parse(body);

    // If this address is set as default, unset other defaults
    if (validatedData.isDefault) {
      await db
        .update(businessEntityAddress)
        .set({ isDefault: false })
        .where(
          and(
            eq(businessEntityAddress.entityId, entityId),
            isNull(businessEntityAddress.deletedAt)
          )
        );
    }

    // Create the address
    const newAddress = await db
      .insert(businessEntityAddress)
      .values({
        id: randomUUID(),
        entityId,
        ...validatedData,
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json({
      data: newAddress[0],
      message: "Address created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating address:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return DatabaseErrorHandler.handle(error);
  }
}