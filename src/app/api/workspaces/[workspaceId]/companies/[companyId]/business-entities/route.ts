import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { workspace, workspaceMember, businessEntity, businessEntityContact } from "@/db/schema";
import { eq, and, or, sql, ilike, desc, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// GET /api/workspaces/[workspaceId]/companies/[companyId]/business-entities
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId, companyId } = params;
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType"); // 'customer', 'supplier', 'both', or null for all
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

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

    // Build query conditions
    const conditions = [
      eq(businessEntity.workspaceId, workspaceId),
      eq(businessEntity.companyId, companyId),
      sql`${businessEntity.deletedAt} IS NULL`
    ];

    // Filter by entity type if specified
    if (entityType && ['customer', 'supplier', 'both'].includes(entityType)) {
      conditions.push(eq(businessEntity.entityType, entityType as any));
    }

    // Filter by status if specified
    if (status) {
      conditions.push(eq(businessEntity.status, status as any));
    }

    // Add search condition if provided
    if (search) {
      conditions.push(
        or(
          ilike(businessEntity.name, `%${search}%`),
          ilike(businessEntity.fullName, `%${search}%`),
          ilike(businessEntity.email, `%${search}%`),
          ilike(businessEntity.phone, `%${search}%`),
          ilike(businessEntity.taxNumber, `%${search}%`),
          ilike(businessEntity.customerCode, `%${search}%`),
          ilike(businessEntity.supplierCode, `%${search}%`)
        )!
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessEntity)
      .where(and(...conditions));

    const totalCount = Number(countResult[0].count);

    // Build order by clause
    let orderByClause;
    switch (sortBy) {
      case 'createdAt':
        orderByClause = sortOrder === 'desc' 
          ? desc(businessEntity.createdAt) 
          : asc(businessEntity.createdAt);
        break;
      case 'updatedAt':
        orderByClause = sortOrder === 'desc' 
          ? desc(businessEntity.updatedAt) 
          : asc(businessEntity.updatedAt);
        break;
      case 'name':
      default:
        orderByClause = sortOrder === 'desc' 
          ? desc(businessEntity.name) 
          : asc(businessEntity.name);
        break;
    }

    // Get entities with pagination
    const entities = await db
      .select()
      .from(businessEntity)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get contacts for each entity
    const entityIds = entities.map(e => e.id);
    const contacts = entityIds.length > 0 ? await db
      .select()
      .from(businessEntityContact)
      .where(
        and(
          sql`${businessEntityContact.entityId} IN ${entityIds}`,
          sql`${businessEntityContact.deletedAt} IS NULL`
        )
      ) : [];

    // Group contacts by entity
    const contactsByEntity = contacts.reduce((acc, contact) => {
      if (!acc[contact.entityId]) {
        acc[contact.entityId] = [];
      }
      acc[contact.entityId].push(contact);
      return acc;
    }, {} as Record<string, typeof contacts>);

    // Combine entities with their contacts
    const entitiesWithContacts = entities.map(entity => ({
      ...entity,
      contacts: contactsByEntity[entity.id] || []
    }));

    return NextResponse.json({
      entities: entitiesWithContacts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching business entities:", error);
    return NextResponse.json(
      { error: "Failed to fetch business entities" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/companies/[companyId]/business-entities
export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string; companyId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { workspaceId, companyId } = params;
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

    // Validate entity type
    if (!body.entityType || !['customer', 'supplier', 'both'].includes(body.entityType)) {
      return NextResponse.json(
        { error: "Invalid entity type. Must be 'customer', 'supplier', or 'both'" },
        { status: 400 }
      );
    }

    // Check for duplicate tax number if provided
    if (body.taxNumber) {
      const existing = await db
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

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "A business entity with this tax number already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate customer code if entity is customer or both
    if ((body.entityType === 'customer' || body.entityType === 'both') && body.customerCode) {
      const existing = await db
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

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "A customer with this code already exists" },
          { status: 400 }
        );
      }
    }

    // Check for duplicate supplier code if entity is supplier or both
    if ((body.entityType === 'supplier' || body.entityType === 'both') && body.supplierCode) {
      const existing = await db
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

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "A supplier with this code already exists" },
          { status: 400 }
        );
      }
    }

    // Create the business entity
    const newEntity = await db.insert(businessEntity).values({
      id: createId(),
      workspaceId,
      companyId,
      entityType: body.entityType,
      name: body.name,
      fullName: body.fullName || null,
      logoUrl: body.logoUrl || null,
      entityCategory: body.entityCategory || null,
      businessType: body.businessType || 'company',
      status: body.status || 'active',
      industry: body.industry || null,
      priority: body.priority || 'medium',
      
      // Contact information
      phone: body.phone || null,
      email: body.email || null,
      website: body.website || null,
      fax: body.fax || null,
      
      // Address
      address: body.address || null,
      district: body.district || null,
      city: body.city || null,
      postalCode: body.postalCode || null,
      country: body.country || 'Türkiye',
      
      // Financial & legal
      taxOffice: body.taxOffice || null,
      taxNumber: body.taxNumber || null,
      mersisNumber: body.mersisNumber || null,
      tradeRegistryNumber: body.tradeRegistryNumber || null,
      
      // Financial
      defaultCurrency: body.defaultCurrency || 'TRY',
      creditLimit: body.creditLimit || null,
      paymentTerms: body.paymentTerms || null,
      discountRate: body.discountRate || null,
      
      // Codes
      entityCode: body.entityCode || null,
      customerCode: body.customerCode || null,
      supplierCode: body.supplierCode || null,
      
      // Supplier specific (if applicable)
      leadTimeDays: body.leadTimeDays || null,
      minimumOrderQuantity: body.minimumOrderQuantity || null,
      orderIncrement: body.orderIncrement || null,
      qualityRating: body.qualityRating || null,
      deliveryRating: body.deliveryRating || null,
      
      // Defense industry
      defenseContractor: body.defenseContractor || false,
      exportLicense: body.exportLicense || false,
      securityClearance: body.securityClearance || null,
      certifications: body.certifications || [],
      
      // Contact person
      primaryContactName: body.primaryContactName || null,
      primaryContactTitle: body.primaryContactTitle || null,
      primaryContactPhone: body.primaryContactPhone || null,
      primaryContactEmail: body.primaryContactEmail || null,
      
      // Relationships
      parentEntityId: body.parentEntityId || null,
      entityGroup: body.entityGroup || null,
      tags: body.tags || [],
      
      // Notes
      notes: body.notes || null,
      internalNotes: body.internalNotes || null,
      metadata: body.metadata || {},
      
      // Audit
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning();

    return NextResponse.json({
      entity: newEntity[0],
      message: "Business entity created successfully"
    });

  } catch (error) {
    console.error("Error creating business entity:", error);
    return NextResponse.json(
      { error: "Failed to create business entity" },
      { status: 500 }
    );
  }
}