import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { workspace, workspaceMember, businessEntity, businessEntityContact, businessEntityProduct } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// GET /api/workspaces/[workspaceId]/companies/[companyId]/business-entities/[entityId]
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string; entityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId, companyId, entityId } = params;

    // Check if user is a member of this workspace
    const member = await db
      .select()
      .from(workspaceMember)
      .where(and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, session.user.id)
      ))
      .limit(1);

    if (member.length === 0) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Get entity with related data
    const entities = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, entityId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          sql`${businessEntity.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (entities.length === 0) {
      return NextResponse.json(
        { error: "Business entity not found" },
        { status: 404 }
      );
    }

    const entity = entities[0];

    // Get contacts
    const contacts = await db
      .select()
      .from(businessEntityContact)
      .where(
        and(
          eq(businessEntityContact.entityId, entityId),
          sql`${businessEntityContact.deletedAt} IS NULL`
        )
      )
      .orderBy(businessEntityContact.isPrimary);

    // Get products if entity is a supplier
    let products = [];
    if (entity.entityType === 'supplier' || entity.entityType === 'both') {
      const entityProducts = await db
        .select()
        .from(businessEntityProduct)
        .where(
          and(
            eq(businessEntityProduct.entityId, entityId),
            sql`${businessEntityProduct.deletedAt} IS NULL`
          )
        );
      
      products = entityProducts;
    }

    return NextResponse.json({
      entity: {
        ...entity,
        contacts,
        products
      }
    });

  } catch (error) {
    console.error("Error fetching business entity:", error);
    return NextResponse.json(
      { error: "Failed to fetch business entity" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[workspaceId]/companies/[companyId]/business-entities/[entityId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string; entityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId, companyId, entityId } = params;
    const body = await request.json();

    // Check if user is a member of this workspace
    const member = await db
      .select()
      .from(workspaceMember)
      .where(and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, session.user.id)
      ))
      .limit(1);

    if (member.length === 0) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Check if entity exists
    const existingEntities = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, entityId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          sql`${businessEntity.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingEntities.length === 0) {
      return NextResponse.json(
        { error: "Business entity not found" },
        { status: 404 }
      );
    }

    const existingEntity = existingEntities[0];

    // Check for duplicate customer code if changed
    if (body.customerCode && body.customerCode !== existingEntity.customerCode) {
      const duplicates = await db
        .select()
        .from(businessEntity)
        .where(
          and(
            eq(businessEntity.workspaceId, workspaceId),
            eq(businessEntity.companyId, companyId),
            eq(businessEntity.customerCode, body.customerCode),
            sql`${businessEntity.deletedAt} IS NULL`
          )
        )
        .limit(1);

      if (duplicates.length > 0) {
        return NextResponse.json(
          { error: "A business entity with this customer code already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate supplier code if changed
    if (body.supplierCode && body.supplierCode !== existingEntity.supplierCode) {
      const duplicates = await db
        .select()
        .from(businessEntity)
        .where(
          and(
            eq(businessEntity.workspaceId, workspaceId),
            eq(businessEntity.companyId, companyId),
            eq(businessEntity.supplierCode, body.supplierCode),
            sql`${businessEntity.deletedAt} IS NULL`
          )
        )
        .limit(1);

      if (duplicates.length > 0) {
        return NextResponse.json(
          { error: "A business entity with this supplier code already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate tax number if changed
    if (body.taxNumber && body.taxNumber !== existingEntity.taxNumber) {
      const duplicates = await db
        .select()
        .from(businessEntity)
        .where(
          and(
            eq(businessEntity.workspaceId, workspaceId),
            eq(businessEntity.taxNumber, body.taxNumber),
            sql`${businessEntity.deletedAt} IS NULL`
          )
        )
        .limit(1);

      if (duplicates.length > 0) {
        return NextResponse.json(
          { error: "A business entity with this tax number already exists" },
          { status: 400 }
        );
      }
    }

    // Update the entity
    const updatedEntity = await db
      .update(businessEntity)
      .set({
        ...body,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(businessEntity.id, entityId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId)
        )
      )
      .returning();

    return NextResponse.json({
      entity: updatedEntity[0],
      message: "Business entity updated successfully"
    });

  } catch (error) {
    console.error("Error updating business entity:", error);
    return NextResponse.json(
      { error: "Failed to update business entity" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId]/companies/[companyId]/business-entities/[entityId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string; entityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId, companyId, entityId } = params;

    // Check if user is a member of this workspace
    const member = await db
      .select()
      .from(workspaceMember)
      .where(and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, session.user.id)
      ))
      .limit(1);

    if (member.length === 0) {
      return NextResponse.json(
        { error: "Not a member of this workspace" },
        { status: 403 }
      );
    }

    // Check if entity exists
    const existingEntities = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, entityId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          sql`${businessEntity.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingEntities.length === 0) {
      return NextResponse.json(
        { error: "Business entity not found" },
        { status: 404 }
      );
    }

    // Check if entity has active products (for suppliers)
    const activeProducts = await db
      .select()
      .from(businessEntityProduct)
      .where(
        and(
          eq(businessEntityProduct.entityId, entityId),
          sql`${businessEntityProduct.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (activeProducts.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete business entity with active products" },
        { status: 400 }
      );
    }

    // TODO: Check for active orders, taleps, etc.

    // Soft delete the entity
    await db
      .update(businessEntity)
      .set({
        deletedAt: new Date(),
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(businessEntity.id, entityId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId)
        )
      );

    return NextResponse.json({
      message: "Business entity deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting business entity:", error);
    return NextResponse.json(
      { error: "Failed to delete business entity" },
      { status: 500 }
    );
  }
}