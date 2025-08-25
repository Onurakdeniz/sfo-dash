import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/index';
import { businessEntity, businessEntityAddress, businessEntityContact } from '@/db/schema/tables/businessEntity';
import { eq, and, or, desc, asc, like, sql } from 'drizzle-orm';

/**
 * Example API route for business entities
 * This replaces both /customers and /suppliers routes
 */

// GET /api/workspaces/[workspaceId]/business-entities
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType'); // 'customer', 'supplier', 'both', or null for all
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where conditions
    const conditions = [
      eq(businessEntity.workspaceId, params.workspaceId),
      eq(businessEntity.deletedAt, null)
    ];

    // Filter by entity type
    if (entityType === 'customer') {
      conditions.push(
        or(
          eq(businessEntity.entityType, 'customer'),
          eq(businessEntity.entityType, 'both')
        )
      );
    } else if (entityType === 'supplier') {
      conditions.push(
        or(
          eq(businessEntity.entityType, 'supplier'),
          eq(businessEntity.entityType, 'both')
        )
      );
    } else if (entityType === 'both') {
      conditions.push(eq(businessEntity.entityType, 'both'));
    }

    // Add search condition
    if (search) {
      conditions.push(
        or(
          like(businessEntity.name, `%${search}%`),
          like(businessEntity.email, `%${search}%`),
          like(businessEntity.phone, `%${search}%`),
          like(businessEntity.taxNumber, `%${search}%`)
        )
      );
    }

    // Execute query with pagination
    const offset = (page - 1) * limit;
    
    const [entities, totalCount] = await Promise.all([
      db
        .select()
        .from(businessEntity)
        .where(and(...conditions))
        .orderBy(
          sortOrder === 'asc' 
            ? asc(businessEntity[sortBy as keyof typeof businessEntity]) 
            : desc(businessEntity[sortBy as keyof typeof businessEntity])
        )
        .limit(limit)
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(businessEntity)
        .where(and(...conditions))
    ]);

    return NextResponse.json({
      data: entities,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching business entities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business entities' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/business-entities
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const body = await request.json();
    
    // Validate entity type
    if (!['customer', 'supplier', 'both'].includes(body.entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type. Must be customer, supplier, or both' },
        { status: 400 }
      );
    }

    // Create the business entity
    const newEntity = await db
      .insert(businessEntity)
      .values({
        ...body,
        workspaceId: params.workspaceId,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    // If addresses are provided, create them
    if (body.addresses && Array.isArray(body.addresses)) {
      for (const address of body.addresses) {
        await db.insert(businessEntityAddress).values({
          ...address,
          entityId: newEntity[0].id,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // If contacts are provided, create them
    if (body.contacts && Array.isArray(body.contacts)) {
      for (const contact of body.contacts) {
        await db.insert(businessEntityContact).values({
          ...contact,
          entityId: newEntity[0].id,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    return NextResponse.json({
      data: newEntity[0],
      message: `Business entity created successfully as ${body.entityType}`
    });
  } catch (error) {
    console.error('Error creating business entity:', error);
    return NextResponse.json(
      { error: 'Failed to create business entity' },
      { status: 500 }
    );
  }
}

// Example: Converting existing customer-specific logic
export async function getCustomers(workspaceId: string, companyId?: string) {
  const conditions = [
    eq(businessEntity.workspaceId, workspaceId),
    or(
      eq(businessEntity.entityType, 'customer'),
      eq(businessEntity.entityType, 'both')
    )
  ];

  if (companyId) {
    conditions.push(eq(businessEntity.companyId, companyId));
  }

  return db
    .select()
    .from(businessEntity)
    .where(and(...conditions))
    .orderBy(desc(businessEntity.createdAt));
}

// Example: Converting existing supplier-specific logic
export async function getSuppliers(workspaceId: string, companyId?: string) {
  const conditions = [
    eq(businessEntity.workspaceId, workspaceId),
    or(
      eq(businessEntity.entityType, 'supplier'),
      eq(businessEntity.entityType, 'both')
    )
  ];

  if (companyId) {
    conditions.push(eq(businessEntity.companyId, companyId));
  }

  return db
    .select()
    .from(businessEntity)
    .where(and(...conditions))
    .orderBy(desc(businessEntity.createdAt));
}

// Example: Get entities that are both customers and suppliers
export async function getDualEntities(workspaceId: string) {
  return db
    .select()
    .from(businessEntity)
    .where(
      and(
        eq(businessEntity.workspaceId, workspaceId),
        eq(businessEntity.entityType, 'both')
      )
    )
    .orderBy(desc(businessEntity.createdAt));
}

// Example: Convert an existing customer to also be a supplier
export async function convertCustomerToSupplier(
  entityId: string,
  supplierFields: {
    supplierCode?: string;
    leadTimeDays?: number;
    minimumOrderQuantity?: number;
    qualityRating?: number;
    deliveryRating?: number;
  }
) {
  return db
    .update(businessEntity)
    .set({
      entityType: 'both',
      ...supplierFields,
      updatedAt: new Date()
    })
    .where(eq(businessEntity.id, entityId))
    .returning();
}
