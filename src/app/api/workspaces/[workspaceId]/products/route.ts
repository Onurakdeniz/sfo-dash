import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceMember, product, productInventory, supplierProduct } from "@/db/schema";
import { eq, and, desc, asc, like, or, count, sum, sql } from "drizzle-orm";
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
      eq(product.workspaceId, workspaceId),
      sql`${product.deletedAt} IS NULL`
    ];

    if (companyId) {
      conditions.push(eq(product.companyId, companyId));
    }

    if (search) {
      conditions.push(
        or(
          like(product.name, `%${search}%`),
          like(product.sku, `%${search}%`),
          like(product.barcode, `%${search}%`),
          like(product.manufacturer, `%${search}%`),
          like(product.brand, `%${search}%`)
        )
      );
    }

    if (status) {
      conditions.push(eq(product.status, status as any));
    }

    if (category) {
      conditions.push(eq(product.productCategory, category as any));
    }

    if (type) {
      conditions.push(eq(product.productType, type as any));
    }

    // Get total count
    const totalCount = await db.select({ count: count() })
      .from(product)
      .where(and(...conditions));

    // Build order by clause
    const orderByColumn = sortBy === "name" ? product.name :
                         sortBy === "sku" ? product.sku :
                         sortBy === "price" ? product.basePrice :
                         sortBy === "updatedAt" ? product.updatedAt :
                         product.createdAt;

    const orderByDirection = sortOrder === "asc" ? asc : desc;

    // Get products with pagination
    const products = await db.select({
      product: product,
      totalStock: sql<number>`COALESCE(SUM(${productInventory.quantityOnHand}), 0)`,
      availableStock: sql<number>`COALESCE(SUM(${productInventory.quantityAvailable}), 0)`,
      supplierCount: sql<number>`COUNT(DISTINCT ${supplierProduct.supplierId})`,
    })
    .from(product)
    .leftJoin(productInventory, eq(product.id, productInventory.productId))
    .leftJoin(supplierProduct, and(
      eq(product.id, supplierProduct.productId),
      eq(supplierProduct.isActive, true)
    ))
    .where(and(...conditions))
    .groupBy(product.id)
    .orderBy(orderByDirection(orderByColumn))
    .limit(limit)
    .offset((page - 1) * limit);

    // Format response
    const formattedProducts = products.map(item => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      shortDescription: item.product.shortDescription,
      sku: item.product.sku,
      barcode: item.product.barcode,
      productType: item.product.productType,
      productCategory: item.product.productCategory,
      status: item.product.status,
      unit: item.product.unit,
      basePrice: item.product.basePrice,
      currency: item.product.currency,
      taxRate: item.product.taxRate,
      manufacturer: item.product.manufacturer,
      brand: item.product.brand,
      primaryImageUrl: item.product.primaryImageUrl,
      trackInventory: item.product.trackInventory,
      totalStock: parseInt(item.totalStock.toString()),
      availableStock: parseInt(item.availableStock.toString()),
      supplierCount: parseInt(item.supplierCount.toString()),
      createdAt: item.product.createdAt,
      updatedAt: item.product.updatedAt,
    }));

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
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
    if (!body.name || !body.sku || !body.companyId) {
      return NextResponse.json(
        { error: "Name, SKU, and company ID are required" },
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

    // Check if SKU already exists in the workspace and company
    const existingSKU = await db.select()
      .from(product)
      .where(
        and(
          eq(product.workspaceId, workspaceId),
          eq(product.companyId, body.companyId),
          eq(product.sku, body.sku),
          sql`${product.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingSKU.length > 0) {
      return NextResponse.json(
        { error: "A product with this SKU already exists" },
        { status: 409 }
      );
    }

    // Check if barcode already exists (if provided)
    if (body.barcode) {
      const existingBarcode = await db.select()
        .from(product)
        .where(
          and(
            eq(product.workspaceId, workspaceId),
            eq(product.companyId, body.companyId),
            eq(product.barcode, body.barcode),
            sql`${product.deletedAt} IS NULL`
          )
        )
        .limit(1);

      if (existingBarcode.length > 0) {
        return NextResponse.json(
          { error: "A product with this barcode already exists" },
          { status: 409 }
        );
      }
    }

    // Create the product
    const newProduct = await db.insert(product)
      .values({
        id: nanoid(),
        workspaceId,
        companyId: body.companyId,
        name: body.name,
        description: body.description,
        shortDescription: body.shortDescription,
        sku: body.sku,
        barcode: body.barcode,
        qrCode: body.qrCode,
        productType: body.productType || "physical",
        productCategory: body.productCategory,
        status: body.status || "active",
        internalCode: body.internalCode,
        manufacturerCode: body.manufacturerCode,
        supplierCode: body.supplierCode,
        customsCode: body.customsCode,
        unit: body.unit || "piece",
        weight: body.weight,
        width: body.width,
        height: body.height,
        depth: body.depth,
        volume: body.volume,
        trackInventory: body.trackInventory ?? true,
        minStockLevel: body.minStockLevel,
        maxStockLevel: body.maxStockLevel,
        reorderPoint: body.reorderPoint,
        reorderQuantity: body.reorderQuantity,
        leadTimeDays: body.leadTimeDays,
        basePrice: body.basePrice,
        currency: body.currency || "TRY",
        taxRate: body.taxRate ?? 18,
        manufacturer: body.manufacturer,
        brand: body.brand,
        model: body.model,
        countryOfOrigin: body.countryOfOrigin,
        launchDate: body.launchDate,
        warrantyPeriod: body.warrantyPeriod,
        primaryImageUrl: body.primaryImageUrl,
        images: body.images || [],
        documents: body.documents || [],
        features: body.features || {},
        specifications: body.specifications || {},
        tags: body.tags || [],
        packagingUnit: body.packagingUnit,
        unitsPerPackage: body.unitsPerPackage,
        packagesPerPallet: body.packagesPerPallet,
        qualityGrade: body.qualityGrade,
        certifications: body.certifications || [],
        notes: body.notes,
        internalNotes: body.internalNotes,
        metadata: body.metadata,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        seoKeywords: body.seoKeywords || [],
        createdBy: session.user.id,
        updatedBy: session.user.id,
      })
      .returning();

    // If initial stock is provided, create inventory record
    if (body.initialStock && body.initialStock > 0) {
      await db.insert(productInventory)
        .values({
          id: nanoid(),
          productId: newProduct[0].id,
          warehouseId: body.warehouseId,
          location: body.location,
          quantityOnHand: body.initialStock,
          quantityAvailable: body.initialStock,
          quantityReserved: 0,
          quantityIncoming: 0,
          quantityOutgoing: 0,
          averageCost: body.basePrice,
          lastPurchasePrice: body.basePrice,
          totalValue: body.basePrice ? body.basePrice * body.initialStock : 0,
          updatedBy: session.user.id,
        });
    }

    return NextResponse.json({
      success: true,
      product: newProduct[0],
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}