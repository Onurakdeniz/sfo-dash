import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businessEntityAddress, businessEntity, workspace, workspaceCompany, company } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { slugifyCompanyFirstWord } from "@/lib/slug";

const updateAddressSchema = z.object({
  addressType: z.string().optional(),
  title: z.string().optional().nullable().transform(val => val === '' ? null : val),
  address: z.string().optional(),
  district: z.string().optional().nullable().transform(val => val === '' ? null : val),
  city: z.string().optional().nullable().transform(val => val === '' ? null : val),
  postalCode: z.string().optional().nullable().transform(val => val === '' ? null : val),
  country: z.string().optional(),
  phone: z.string().optional().nullable().transform(val => val === '' ? null : val),
  email: z.union([
    z.string().email("Invalid email"),
    z.literal(''),
    z.null()
  ]).optional().nullable().transform(val => (val === '' || val === null) ? null : val),
  contactName: z.string().optional().nullable().transform(val => val === '' ? null : val),
  contactTitle: z.string().optional().nullable().transform(val => val === '' ? null : val),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// GET - Fetch a single address
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string; addressId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { addressId, customerId, workspaceId: workspaceSlug, companyId: companySlug } = await params;

    // Resolve workspace slug to ID
    const [workspaceData] = await db.select()
      .from(workspace)
      .where(eq(workspace.slug, workspaceSlug))
      .limit(1);

    if (!workspaceData) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Resolve company slug to ID
    const companiesData = await db.select({
      company: company,
      workspaceCompany: workspaceCompany,
    })
    .from(company)
    .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
    .where(eq(workspaceCompany.workspaceId, workspaceData.id));

    const companyData = companiesData.find(c => 
      slugifyCompanyFirstWord(c.company.name || '') === companySlug
    );

    if (!companyData) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const workspaceId = workspaceData.id;
    const companyId = companyData.company.id;

    // First check if the customer (business entity) exists
    const entity = await db.select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, customerId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId)
        )
      )
      .limit(1);

    if (!entity.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [address] = await db.select()
      .from(businessEntityAddress)
      .where(and(
        eq(businessEntityAddress.id, addressId),
        eq(businessEntityAddress.entityId, customerId)
      ))
      .limit(1);

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Error fetching address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string; addressId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { addressId, customerId, workspaceId: workspaceSlug, companyId: companySlug } = await params;
    const body = await request.json();
    const data = updateAddressSchema.parse(body);

    // Resolve workspace slug to ID
    const [workspaceData] = await db.select()
      .from(workspace)
      .where(eq(workspace.slug, workspaceSlug))
      .limit(1);

    if (!workspaceData) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Resolve company slug to ID
    const companiesData = await db.select({
      company: company,
      workspaceCompany: workspaceCompany,
    })
    .from(company)
    .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
    .where(eq(workspaceCompany.workspaceId, workspaceData.id));

    const companyData = companiesData.find(c => 
      slugifyCompanyFirstWord(c.company.name || '') === companySlug
    );

    if (!companyData) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const workspaceId = workspaceData.id;
    const companyId = companyData.company.id;

    // First check if the customer (business entity) exists
    const entity = await db.select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, customerId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId)
        )
      )
      .limit(1);

    if (!entity.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // If setting as default, unset other defaults for this customer
    if (data.isDefault === true) {
      await db.update(businessEntityAddress)
        .set({ isDefault: false })
        .where(eq(businessEntityAddress.entityId, customerId));
    }

    const [updated] = await db.update(businessEntityAddress)
      .set({
        ...data,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(and(
        eq(businessEntityAddress.id, addressId),
        eq(businessEntityAddress.entityId, customerId)
      ))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address: updated, message: "Address updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string; addressId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { addressId, customerId, workspaceId: workspaceSlug, companyId: companySlug } = await params;

    // Resolve workspace slug to ID
    const [workspaceData] = await db.select()
      .from(workspace)
      .where(eq(workspace.slug, workspaceSlug))
      .limit(1);

    if (!workspaceData) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Resolve company slug to ID
    const companiesData = await db.select({
      company: company,
      workspaceCompany: workspaceCompany,
    })
    .from(company)
    .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
    .where(eq(workspaceCompany.workspaceId, workspaceData.id));

    const companyData = companiesData.find(c => 
      slugifyCompanyFirstWord(c.company.name || '') === companySlug
    );

    if (!companyData) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const workspaceId = workspaceData.id;
    const companyId = companyData.company.id;

    // First check if the customer (business entity) exists
    const entity = await db.select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, customerId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId)
        )
      )
      .limit(1);

    if (!entity.length) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [deleted] = await db
      .delete(businessEntityAddress)
      .where(and(
        eq(businessEntityAddress.id, addressId),
        eq(businessEntityAddress.entityId, customerId)
      ))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


