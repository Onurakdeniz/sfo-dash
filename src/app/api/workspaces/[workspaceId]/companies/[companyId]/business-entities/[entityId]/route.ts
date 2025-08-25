import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { businessEntity, businessEntityAddress, businessEntityContact, businessEntityFile, businessEntityNote, workspace, workspaceCompany, workspaceMember } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { DatabaseErrorHandler } from "@/lib/database-errors";
import { z } from "zod";

// Validation schema for updating business entities
const updateBusinessEntitySchema = z.object({
  entityType: z.enum(["customer", "supplier", "both"]).optional(),
  name: z.string().min(1, "Entity name is required").max(255).optional(),
  fullName: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  entityCategory: z.enum(["vip", "premium", "standard", "basic", "wholesale", "retail", "strategic", "preferred", "approved", "probation"]).optional().nullable(),
  businessType: z.enum(["company", "individual", "government"]).optional(),
  status: z.enum(["active", "inactive", "prospect", "lead", "suspended", "closed", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  industry: z.string().optional().nullable(),

  // Contact information
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")).nullable(),
  fax: z.string().optional().nullable(),

  // Address
  address: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional(),

  // Turkish business identifiers
  taxOffice: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  mersisNumber: z.string().optional().nullable(),
  tradeRegistryNumber: z.string().optional().nullable(),

  // Financial
  defaultCurrency: z.string().length(3, "Currency must be 3 characters").optional(),
  creditLimit: z.coerce.number().min(0).optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  discountRate: z.coerce.number().min(0).max(100).optional().nullable(),

  // Business entity codes
  entityCode: z.string().optional().nullable(),
  supplierCode: z.string().optional().nullable(),
  customerCode: z.string().optional().nullable(),

  // Supplier specific fields
  leadTimeDays: z.coerce.number().min(0).optional().nullable(),
  minimumOrderQuantity: z.coerce.number().min(0).optional().nullable(),
  orderIncrement: z.coerce.number().min(0).optional().nullable(),
  qualityRating: z.coerce.number().min(0).max(5).optional().nullable(),
  deliveryRating: z.coerce.number().min(0).max(5).optional().nullable(),

  // Defense industry specific
  defenseContractor: z.boolean().optional(),
  exportLicense: z.boolean().optional(),
  securityClearance: z.string().optional().nullable(),
  certifications: z.array(z.any()).optional(),

  // Primary contact
  primaryContactName: z.string().optional().nullable(),
  primaryContactTitle: z.string().optional().nullable(),
  primaryContactPhone: z.string().optional().nullable(),
  primaryContactEmail: z.string().email("Invalid email format").optional().or(z.literal("")).nullable(),

  // Additional fields
  parentEntityId: z.string().optional().nullable(),
  entityGroup: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
});

function normalizeEntityBody(input: any) {
  const emptyToNull = (v: any) => (v === '' || v === undefined ? null : v);
  const normalized: any = {};
  
  Object.keys(input).forEach(key => {
    if (input[key] !== undefined) {
      if (key === 'entityCategory' && input[key] === 'select') {
        normalized[key] = null;
      } else if (typeof input[key] === 'string' && input[key] === '') {
        normalized[key] = null;
      } else if (['creditLimit', 'discountRate', 'leadTimeDays', 'minimumOrderQuantity', 'orderIncrement', 'qualityRating', 'deliveryRating'].includes(key)) {
        normalized[key] = input[key] === '' || input[key] === undefined ? null : input[key];
      } else {
        normalized[key] = input[key];
      }
    }
  });
  
  return normalized;
}

// GET - Get single business entity with related data
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

    // Get the business entity with related data
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

    // Get related addresses
    const addresses = await db
      .select()
      .from(businessEntityAddress)
      .where(
        and(
          eq(businessEntityAddress.entityId, entityId),
          isNull(businessEntityAddress.deletedAt)
        )
      );

    // Get related contacts
    const contacts = await db
      .select()
      .from(businessEntityContact)
      .where(
        and(
          eq(businessEntityContact.entityId, entityId),
          isNull(businessEntityContact.deletedAt)
        )
      );

    // Get related files count
    const filesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessEntityFile)
      .where(
        and(
          eq(businessEntityFile.entityId, entityId),
          isNull(businessEntityFile.deletedAt)
        )
      );

    // Get related notes count
    const notesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessEntityNote)
      .where(
        and(
          eq(businessEntityNote.entityId, entityId),
          isNull(businessEntityNote.deletedAt)
        )
      );

    return NextResponse.json({
      ...entity,
      addresses,
      contacts,
      filesCount: Number(filesCount[0]?.count || 0),
      notesCount: Number(notesCount[0]?.count || 0)
    });
  } catch (error) {
    console.error("Error fetching business entity:", error);
    return DatabaseErrorHandler.handle(error);
  }
}

// PATCH - Update business entity
export async function PATCH(
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
    const [existingEntity] = await db
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

    if (!existingEntity) {
      return NextResponse.json({ error: "Business entity not found" }, { status: 404 });
    }

    // Normalize and validate the request body
    const normalizedBody = normalizeEntityBody(body);
    const validatedData = updateBusinessEntitySchema.parse(normalizedBody);

    // Check for duplicate entity codes if provided
    if (validatedData.entityCode && validatedData.entityCode !== existingEntity.entityCode) {
      const existingCode = await db
        .select()
        .from(businessEntity)
        .where(
          and(
            eq(businessEntity.workspaceId, workspaceId),
            eq(businessEntity.companyId, companyId),
            eq(businessEntity.entityCode, validatedData.entityCode),
            isNull(businessEntity.deletedAt)
          )
        )
        .limit(1);

      if (existingCode.length > 0) {
        return NextResponse.json(
          { error: "Entity code already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate supplier code if provided
    if (validatedData.supplierCode && validatedData.supplierCode !== existingEntity.supplierCode) {
      const existingSupplierCode = await db
        .select()
        .from(businessEntity)
        .where(
          and(
            eq(businessEntity.workspaceId, workspaceId),
            eq(businessEntity.companyId, companyId),
            eq(businessEntity.supplierCode, validatedData.supplierCode),
            isNull(businessEntity.deletedAt)
          )
        )
        .limit(1);

      if (existingSupplierCode.length > 0) {
        return NextResponse.json(
          { error: "Supplier code already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate customer code if provided
    if (validatedData.customerCode && validatedData.customerCode !== existingEntity.customerCode) {
      const existingCustomerCode = await db
        .select()
        .from(businessEntity)
        .where(
          and(
            eq(businessEntity.workspaceId, workspaceId),
            eq(businessEntity.companyId, companyId),
            eq(businessEntity.customerCode, validatedData.customerCode),
            isNull(businessEntity.deletedAt)
          )
        )
        .limit(1);

      if (existingCustomerCode.length > 0) {
        return NextResponse.json(
          { error: "Customer code already exists" },
          { status: 400 }
        );
      }
    }

    // Update the business entity
    const updatedEntity = await db
      .update(businessEntity)
      .set({
        ...validatedData,
        updatedBy: session.user.id,
        updatedAt: new Date()
      })
      .where(eq(businessEntity.id, entityId))
      .returning();

    return NextResponse.json({
      data: updatedEntity[0],
      message: "Business entity updated successfully"
    });
  } catch (error) {
    console.error("Error updating business entity:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return DatabaseErrorHandler.handle(error);
  }
}

// DELETE - Soft delete business entity
export async function DELETE(
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
    const [existingEntity] = await db
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

    if (!existingEntity) {
      return NextResponse.json({ error: "Business entity not found" }, { status: 404 });
    }

    // Soft delete the business entity
    await db
      .update(businessEntity)
      .set({
        deletedAt: new Date(),
        updatedBy: session.user.id,
        updatedAt: new Date()
      })
      .where(eq(businessEntity.id, entityId));

    return NextResponse.json({
      message: "Business entity deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting business entity:", error);
    return DatabaseErrorHandler.handle(error);
  }
}