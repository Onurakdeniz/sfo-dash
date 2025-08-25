import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { businessEntity, businessEntityContact, workspaceMember } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { DatabaseErrorHandler } from "@/lib/database-errors";
import { z } from "zod";
import { randomUUID } from "crypto";

// Validation schema for creating/updating contacts
const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),
  fax: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({})
});

// GET - List contacts for a business entity
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

    // Get contacts
    const contacts = await db
      .select()
      .from(businessEntityContact)
      .where(
        and(
          eq(businessEntityContact.entityId, entityId),
          isNull(businessEntityContact.deletedAt)
        )
      )
      .orderBy(businessEntityContact.isPrimary, businessEntityContact.createdAt);

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return DatabaseErrorHandler.handle(error);
  }
}

// POST - Create a new contact for a business entity
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
    const validatedData = contactSchema.parse(body);

    // If this contact is set as primary, unset other primaries
    if (validatedData.isPrimary) {
      await db
        .update(businessEntityContact)
        .set({ isPrimary: false })
        .where(
          and(
            eq(businessEntityContact.entityId, entityId),
            isNull(businessEntityContact.deletedAt)
          )
        );
    }

    // Create the contact
    const newContact = await db
      .insert(businessEntityContact)
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
      data: newContact[0],
      message: "Contact created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return DatabaseErrorHandler.handle(error);
  }
}