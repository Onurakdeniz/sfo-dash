import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceMember, supplier, supplierContact, supplierAddress } from "@/db/schema";
import { eq, and, desc, asc, like, or, count, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const category = searchParams.get("category") || "";
    const type = searchParams.get("type") || "";
    const priority = searchParams.get("priority") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const companyId = searchParams.get("companyId") || "";

    // Check if workspace exists and user has access
    const workspaceExists = await db.select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceExists.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const isOwner = workspaceExists[0].ownerId === session.user.id;

    if (!isOwner) {
      // Check if user is a member of this workspace
      const membershipCheck = await db.select()
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, workspaceId),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Unauthorized to access this workspace" },
          { status: 403 }
        );
      }
    }

    // Build query conditions
    const conditions = [
      eq(supplier.workspaceId, workspaceId),
      sql`${supplier.deletedAt} IS NULL`
    ];

    if (companyId) {
      conditions.push(eq(supplier.companyId, companyId));
    }

    if (search) {
      conditions.push(
        or(
          like(supplier.name, `%${search}%`),
          like(supplier.fullName, `%${search}%`),
          like(supplier.email, `%${search}%`),
          like(supplier.phone, `%${search}%`),
          like(supplier.taxNumber, `%${search}%`),
          like(supplier.supplierCode, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(supplier.status, status as any));
    }

    if (category) {
      conditions.push(eq(supplier.supplierCategory, category as any));
    }

    if (type) {
      conditions.push(eq(supplier.supplierType, type as any));
    }

    if (priority) {
      conditions.push(eq(supplier.priority, priority));
    }

    // Get total count
    const totalCount = await db.select({ count: count() })
      .from(supplier)
      .where(and(...conditions));

    // Build order by clause
    const orderByColumn = sortBy === "name" ? supplier.name :
                         sortBy === "createdAt" ? supplier.createdAt :
                         sortBy === "updatedAt" ? supplier.updatedAt :
                         sortBy === "qualityRating" ? supplier.qualityRating :
                         sortBy === "deliveryRating" ? supplier.deliveryRating :
                         supplier.createdAt;

    const orderByDirection = sortOrder === "asc" ? asc : desc;

    // Get suppliers with pagination
    const suppliers = await db.select({
      supplier: supplier,
      contactCount: sql<number>`COUNT(DISTINCT ${supplierContact.id})`,
      addressCount: sql<number>`COUNT(DISTINCT ${supplierAddress.id})`,
    })
    .from(supplier)
    .leftJoin(supplierContact, and(
      eq(supplier.id, supplierContact.supplierId),
      sql`${supplierContact.deletedAt} IS NULL`
    ))
    .leftJoin(supplierAddress, and(
      eq(supplier.id, supplierAddress.supplierId),
      sql`${supplierAddress.deletedAt} IS NULL`
    ))
    .where(and(...conditions))
    .groupBy(supplier.id)
    .orderBy(orderByDirection(orderByColumn))
    .limit(limit)
    .offset((page - 1) * limit);

    // Format response
    const formattedSuppliers = suppliers.map(item => ({
      id: item.supplier.id,
      name: item.supplier.name,
      fullName: item.supplier.fullName,
      supplierLogoUrl: item.supplier.supplierLogoUrl,
      supplierType: item.supplier.supplierType,
      supplierCategory: item.supplier.supplierCategory,
      status: item.supplier.status,
      priority: item.supplier.priority,
      phone: item.supplier.phone,
      email: item.supplier.email,
      website: item.supplier.website,
      city: item.supplier.city,
      country: item.supplier.country,
      taxNumber: item.supplier.taxNumber,
      supplierCode: item.supplier.supplierCode,
      creditLimit: item.supplier.creditLimit,
      paymentTerms: item.supplier.paymentTerms,
      discountRate: item.supplier.discountRate,
      leadTimeDays: item.supplier.leadTimeDays,
      qualityRating: item.supplier.qualityRating,
      deliveryRating: item.supplier.deliveryRating,
      contactCount: parseInt(item.contactCount.toString()),
      addressCount: parseInt(item.addressCount.toString()),
      createdAt: item.supplier.createdAt,
      updatedAt: item.supplier.updatedAt,
    }));

    return NextResponse.json({
      suppliers: formattedSuppliers,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.companyId) {
      return NextResponse.json(
        { error: "Name and company ID are required" },
        { status: 400 }
      );
    }

    // Check if workspace exists and user has access
    const workspaceExists = await db.select()
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceExists.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const isOwner = workspaceExists[0].ownerId === session.user.id;

    if (!isOwner) {
      // Check if user is a member of this workspace
      const membershipCheck = await db.select()
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, workspaceId),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Unauthorized to access this workspace" },
          { status: 403 }
        );
      }
    }

    // Check if supplier code already exists (if provided)
    if (body.supplierCode) {
      const existingCode = await db.select()
        .from(supplier)
        .where(
          and(
            eq(supplier.workspaceId, workspaceId),
            eq(supplier.companyId, body.companyId),
            eq(supplier.supplierCode, body.supplierCode),
            sql`${supplier.deletedAt} IS NULL`
          )
        )
        .limit(1);

      if (existingCode.length > 0) {
        return NextResponse.json(
          { error: "A supplier with this code already exists" },
          { status: 409 }
        );
      }
    }

    // Check if tax number already exists (if provided)
    if (body.taxNumber) {
      const existingTaxNumber = await db.select()
        .from(supplier)
        .where(
          and(
            eq(supplier.workspaceId, workspaceId),
            eq(supplier.taxNumber, body.taxNumber),
            sql`${supplier.deletedAt} IS NULL`
          )
        )
        .limit(1);

      if (existingTaxNumber.length > 0) {
        return NextResponse.json(
          { error: "A supplier with this tax number already exists" },
          { status: 409 }
        );
      }
    }

    // Create the supplier
    const newSupplier = await db.insert(supplier)
      .values({
        id: nanoid(),
        workspaceId,
        companyId: body.companyId,
        name: body.name,
        fullName: body.fullName,
        supplierLogoUrl: body.supplierLogoUrl,
        supplierType: body.supplierType || "corporate",
        supplierCategory: body.supplierCategory,
        status: body.status || "active",
        industry: body.industry,
        priority: body.priority || "medium",
        phone: body.phone,
        email: body.email,
        website: body.website,
        fax: body.fax,
        address: body.address,
        district: body.district,
        city: body.city,
        postalCode: body.postalCode,
        country: body.country || "Türkiye",
        taxOffice: body.taxOffice,
        taxNumber: body.taxNumber,
        mersisNumber: body.mersisNumber,
        tradeRegistryNumber: body.tradeRegistryNumber,
        defaultCurrency: body.defaultCurrency || "TRY",
        creditLimit: body.creditLimit,
        paymentTerms: body.paymentTerms,
        discountRate: body.discountRate,
        supplierCode: body.supplierCode,
        leadTimeDays: body.leadTimeDays,
        minimumOrderQuantity: body.minimumOrderQuantity,
        orderIncrement: body.orderIncrement,
        qualityRating: body.qualityRating,
        deliveryRating: body.deliveryRating,
        primaryContactName: body.primaryContactName,
        primaryContactTitle: body.primaryContactTitle,
        primaryContactPhone: body.primaryContactPhone,
        primaryContactEmail: body.primaryContactEmail,
        additionalContacts: body.additionalContacts || [],
        parentSupplierId: body.parentSupplierId,
        supplierGroup: body.supplierGroup,
        tags: body.tags || [],
        notes: body.notes,
        internalNotes: body.internalNotes,
        metadata: body.metadata,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    // Create primary contact if provided
    if (body.primaryContactName) {
      await db.insert(supplierContact)
        .values({
          id: nanoid(),
          supplierId: newSupplier[0].id,
          firstName: body.primaryContactName.split(' ')[0] || body.primaryContactName,
          lastName: body.primaryContactName.split(' ').slice(1).join(' ') || '',
          title: body.primaryContactTitle,
          phone: body.primaryContactPhone,
          email: body.primaryContactEmail,
          isPrimary: true,
          isActive: true,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        });
    }

    // Create default address if provided
    if (body.address) {
      await db.insert(supplierAddress)
        .values({
          id: nanoid(),
          supplierId: newSupplier[0].id,
          addressType: "billing",
          title: "Ana Adres",
          address: body.address,
          district: body.district,
          city: body.city,
          postalCode: body.postalCode,
          country: body.country || "Türkiye",
          phone: body.phone,
          email: body.email,
          isDefault: true,
          isActive: true,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        });
    }

    return NextResponse.json({
      success: true,
      supplier: newSupplier[0],
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}