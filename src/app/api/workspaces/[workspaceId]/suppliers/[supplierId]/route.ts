import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceMember, supplier, supplierContact, supplierAddress, supplierFile, supplierNote, supplierPerformance, supplierProduct } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; supplierId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, supplierId } = await params;

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

    // Get supplier with related data
    const supplierData = await db.select()
      .from(supplier)
      .where(
        and(
          eq(supplier.id, supplierId),
          eq(supplier.workspaceId, workspaceId),
          sql`${supplier.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (supplierData.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Get contacts
    const contacts = await db.select()
      .from(supplierContact)
      .where(
        and(
          eq(supplierContact.supplierId, supplierId),
          sql`${supplierContact.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(supplierContact.isPrimary));

    // Get addresses
    const addresses = await db.select()
      .from(supplierAddress)
      .where(
        and(
          eq(supplierAddress.supplierId, supplierId),
          sql`${supplierAddress.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(supplierAddress.isDefault));

    // Get files
    const files = await db.select()
      .from(supplierFile)
      .where(
        and(
          eq(supplierFile.supplierId, supplierId),
          sql`${supplierFile.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(supplierFile.createdAt));

    // Get recent notes
    const notes = await db.select()
      .from(supplierNote)
      .where(
        and(
          eq(supplierNote.supplierId, supplierId),
          sql`${supplierNote.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(supplierNote.createdAt))
      .limit(10);

    // Get performance history
    const performance = await db.select()
      .from(supplierPerformance)
      .where(
        and(
          eq(supplierPerformance.supplierId, supplierId),
          sql`${supplierPerformance.deletedAt} IS NULL`
        )
      )
      .orderBy(desc(supplierPerformance.periodEnd))
      .limit(12);

    // Get products from this supplier
    const products = await db.select()
      .from(supplierProduct)
      .where(
        and(
          eq(supplierProduct.supplierId, supplierId),
          sql`${supplierProduct.deletedAt} IS NULL`
        )
      )
      .orderBy(supplierProduct.priority);

    return NextResponse.json({
      ...supplierData[0],
      contacts,
      addresses,
      files,
      notes,
      performance,
      products,
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; supplierId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, supplierId } = await params;
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

    // Check if supplier exists
    const existingSupplier = await db.select()
      .from(supplier)
      .where(
        and(
          eq(supplier.id, supplierId),
          eq(supplier.workspaceId, workspaceId),
          sql`${supplier.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingSupplier.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Check if supplier code is being changed and if it already exists
    if (body.supplierCode && body.supplierCode !== existingSupplier[0].supplierCode) {
      const existingCode = await db.select()
        .from(supplier)
        .where(
          and(
            eq(supplier.workspaceId, workspaceId),
            eq(supplier.companyId, existingSupplier[0].companyId),
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

    // Check if tax number is being changed and if it already exists
    if (body.taxNumber && body.taxNumber !== existingSupplier[0].taxNumber) {
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

    // Update the supplier
    const updatedSupplier = await db.update(supplier)
      .set({
        ...body,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplier.id, supplierId),
          eq(supplier.workspaceId, workspaceId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      supplier: updatedSupplier[0],
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; supplierId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, supplierId } = await params;

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
          { error: "Unauthorized to delete suppliers in this workspace" },
          { status: 403 }
        );
      }
    }

    // Check if supplier exists
    const existingSupplier = await db.select()
      .from(supplier)
      .where(
        and(
          eq(supplier.id, supplierId),
          eq(supplier.workspaceId, workspaceId),
          sql`${supplier.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (existingSupplier.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Check if supplier has active products
    const activeProducts = await db.select()
      .from(supplierProduct)
      .where(
        and(
          eq(supplierProduct.supplierId, supplierId),
          eq(supplierProduct.isActive, true),
          sql`${supplierProduct.deletedAt} IS NULL`
        )
      )
      .limit(1);

    if (activeProducts.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete supplier with active products" },
        { status: 400 }
      );
    }

    // Soft delete the supplier
    await db.update(supplier)
      .set({
        deletedAt: new Date(),
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplier.id, supplierId),
          eq(supplier.workspaceId, workspaceId)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}