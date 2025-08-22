import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceMember, product, productInventory, businessEntityProduct, productVariant, productPriceHistory } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; productId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, productId } = await params;

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

    // Get product with related data
    const productData = await db.select({
      product: product,
      totalStock: sql<number>`COALESCE(SUM(${productInventory.quantityOnHand}), 0)`,
      availableStock: sql<number>`COALESCE(SUM(${productInventory.quantityAvailable}), 0)`,
      reservedStock: sql<number>`COALESCE(SUM(${productInventory.quantityReserved}), 0)`,
    })
    .from(product)
    .leftJoin(productInventory, eq(product.id, productInventory.productId))
    .where(
      and(
        eq(product.id, productId),
        eq(product.workspaceId, workspaceId),
        sql`${product.deletedAt} IS NULL`
      )
    )
    .groupBy(product.id);

    if (productData.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get variants
    const variants = await db.select()
      .from(productVariant)
      .where(
        and(
          eq(productVariant.productId, productId),
          sql`${productVariant.deletedAt} IS NULL`
        )
      )
      .orderBy(productVariant.displayOrder);

    // Get suppliers
    const suppliers = await db.select()
      .from(businessEntityProduct)
      .where(
        and(
          eq(businessEntityProduct.productId, productId),
          sql`${businessEntityProduct.deletedAt} IS NULL`
        )
      )
      .orderBy(businessEntityProduct.priority);

    // Get inventory details
    const inventory = await db.select()
      .from(productInventory)
      .where(eq(productInventory.productId, productId));

    // Get recent price history
    const priceHistory = await db.select()
      .from(productPriceHistory)
      .where(eq(productPriceHistory.productId, productId))
      .orderBy(sql`${productPriceHistory.effectiveFrom} DESC`)
      .limit(10);

    const productItem = productData[0];

    return NextResponse.json({
      ...productItem.product,
      totalStock: parseInt(productItem.totalStock.toString()),
      availableStock: parseInt(productItem.availableStock.toString()),
      reservedStock: parseInt(productItem.reservedStock.toString()),
      variants,
      suppliers,
      inventory,
      priceHistory,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; productId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, productId } = await params;
    const body = await request.json();

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

    // Check if product exists
    const existingProduct = await db.select()
      .from(product)
      .where(
        and(
          eq(product.id, productId),
          eq(product.workspaceId, workspaceId),
          sql`${product.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if SKU is being changed and if it already exists
    if (body.sku && body.sku !== existingProduct[0].sku) {
      const existingSKU = await db.select()
        .from(product)
        .where(
          and(
            eq(product.workspaceId, workspaceId),
            eq(product.companyId, existingProduct[0].companyId),
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
    }

    // Check if barcode is being changed and if it already exists
    if (body.barcode && body.barcode !== existingProduct[0].barcode) {
      const existingBarcode = await db.select()
        .from(product)
        .where(
          and(
            eq(product.workspaceId, workspaceId),
            eq(product.companyId, existingProduct[0].companyId),
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

    // Track price changes
    if (body.basePrice && body.basePrice !== existingProduct[0].basePrice) {
      await db.insert(productPriceHistory)
        .values({
          id: crypto.randomUUID(),
          productId,
          priceType: "list",
          oldPrice: existingProduct[0].basePrice,
          newPrice: body.basePrice,
          currency: body.currency || existingProduct[0].currency,
          changeReason: body.priceChangeReason || "Manual update",
          changePercentage: existingProduct[0].basePrice ? 
            ((body.basePrice - parseFloat(existingProduct[0].basePrice)) / parseFloat(existingProduct[0].basePrice)) * 100 : 
            null,
          effectiveFrom: new Date(),
          changedBy: session.user.id,
        });
    }

    // Update the product
    const updatedProduct = await db.update(product)
      .set({
        ...body,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(product.id, productId),
          eq(product.workspaceId, workspaceId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      product: updatedProduct[0],
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; productId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, productId } = await params;

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
      // Check if user is a member of this workspace with admin role
      const membershipCheck = await db.select()
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, workspaceId),
            eq(workspaceMember.userId, session.user.id),
            eq(workspaceMember.role, "admin")
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Unauthorized to delete products in this workspace" },
          { status: 403 }
        );
      }
    }

    // Check if product exists
    const existingProduct = await db.select()
      .from(product)
      .where(
        and(
          eq(product.id, productId),
          eq(product.workspaceId, workspaceId),
          sql`${product.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Soft delete the product
    await db.update(product)
      .set({
        deletedAt: new Date(),
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(product.id, productId),
          eq(product.workspaceId, workspaceId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}