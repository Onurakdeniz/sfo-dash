import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { customer, workspace, workspaceCompany, workspaceMember, company, customerAddress, customerContact, customerFile, customerNote } from "@/db/schema";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { slugifyCompanyFirstWord } from "@/lib/slug";
import { z } from "zod";

// Validation schema for updating customers
const updateCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(255).optional(),
  fullName: z.string().optional(),
  customerLogoUrl: z.string().optional(),
  customerType: z.enum(["individual", "corporate"]).optional(),
  customerCategory: z.enum(["vip", "premium", "standard", "basic", "wholesale", "retail"]).optional(),
  status: z.enum(["active", "inactive", "prospect", "lead", "suspended", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  industry: z.string().optional(),

  // Contact information
  phone: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  fax: z.string().optional(),

  // Address
  address: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),

  // Turkish business identifiers
  taxOffice: z.string().optional(),
  taxNumber: z.string().optional(),
  mersisNumber: z.string().optional(),
  tradeRegistryNumber: z.string().optional(),

  // Financial
  defaultCurrency: z.string().length(3, "Currency must be 3 characters").optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.string().optional(),
  discountRate: z.number().min(0).max(100).optional(),

  // Primary contact
  primaryContactName: z.string().optional(),
  primaryContactTitle: z.string().optional(),
  primaryContactPhone: z.string().optional(),
  primaryContactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),

  // Additional fields
  parentCustomerId: z.string().optional(),
  customerGroup: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET - Get specific customer with related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, customerId } = await params;

    // Resolve workspace by id or slug
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(
        or(
          eq(workspace.id, workspaceIdOrSlug),
          eq(workspace.slug, workspaceIdOrSlug)
        )
      )
      .limit(1);

    if (foundWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;

    // Try resolve by company id directly in this workspace
    const companyById = await db.select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);

    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      // Fallback: resolve by slug derived from company name (first word)
      const companiesInWorkspace = await db.select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));

      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) {
        resolvedCompanyId = matched.cmp.id;
      }
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    const isOwner = resolvedWorkspace.ownerId === session.user.id;
    let userRole = 'owner';
    let userPermissions = null;

    if (!isOwner) {
      // Check if user is a member of this workspace
      const membershipCheck = await db.select({
        role: workspaceMember.role,
        permissions: workspaceMember.permissions,
      })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, resolvedWorkspace.id),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      userRole = membershipCheck[0].role;
      userPermissions = membershipCheck[0].permissions;
    }

    // Get customer with related data
    const customerData = await db.select()
      .from(customer)
      .where(
        and(
          eq(customer.id, customerId),
          eq(customer.workspaceId, resolvedWorkspace.id),
          eq(customer.companyId, resolvedCompanyId),
          isNull(customer.deletedAt)
        )
      )
      .limit(1);

    if (customerData.length === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get related data
    const [addresses, contacts, files, notes] = await Promise.all([
      // Get customer addresses
      db.select()
        .from(customerAddress)
        .where(
          and(
            eq(customerAddress.customerId, customerId),
            isNull(customerAddress.deletedAt)
          )
        )
        .orderBy(customerAddress.createdAt),

      // Get customer contacts
      db.select()
        .from(customerContact)
        .where(
          and(
            eq(customerContact.customerId, customerId),
            isNull(customerContact.deletedAt)
          )
        )
        .orderBy(customerContact.createdAt),

      // Get customer files
      db.select()
        .from(customerFile)
        .where(
          and(
            eq(customerFile.customerId, customerId),
            isNull(customerFile.deletedAt)
          )
        )
        .orderBy(desc(customerFile.createdAt)),

      // Get customer notes
      db.select()
        .from(customerNote)
        .where(
          and(
            eq(customerNote.customerId, customerId),
            isNull(customerNote.deletedAt)
          )
        )
        .orderBy(desc(customerNote.createdAt))
    ]);

    return NextResponse.json({
      customer: customerData[0],
      addresses,
      contacts,
      files,
      notes
    });

  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update specific customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, customerId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = updateCustomerSchema.parse(body);

    // Resolve workspace by id or slug
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(
        or(
          eq(workspace.id, workspaceIdOrSlug),
          eq(workspace.slug, workspaceIdOrSlug)
        )
      )
      .limit(1);

    if (foundWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;

    // Try resolve by company id directly in this workspace
    const companyById = await db.select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);

    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      // Fallback: resolve by slug derived from company name (first word)
      const companiesInWorkspace = await db.select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));

      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) {
        resolvedCompanyId = matched.cmp.id;
      }
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    const isOwner = resolvedWorkspace.ownerId === session.user.id;
    let userRole = 'owner';
    let userPermissions = null;

    if (!isOwner) {
      // Check if user is a member of this workspace
      const membershipCheck = await db.select({
        role: workspaceMember.role,
        permissions: workspaceMember.permissions,
      })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, resolvedWorkspace.id),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      userRole = membershipCheck[0].role;
      userPermissions = membershipCheck[0].permissions;
    }

    // Check if customer exists
    const customerExists = await db.select()
      .from(customer)
      .where(
        and(
          eq(customer.id, customerId),
          eq(customer.workspaceId, resolvedWorkspace.id),
          eq(customer.companyId, resolvedCompanyId),
          isNull(customer.deletedAt)
        )
      )
      .limit(1);

    if (customerExists.length === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check for duplicate email or tax number if provided
    if (validatedData.email && validatedData.email !== customerExists[0].email) {
      const existingEmail = await db.select()
        .from(customer)
        .where(
          and(
            eq(customer.workspaceId, resolvedWorkspace.id),
            eq(customer.companyId, resolvedCompanyId),
            eq(customer.email, validatedData.email),
            isNull(customer.deletedAt)
          )
        )
        .limit(1);

      if (existingEmail.length > 0) {
        return NextResponse.json(
          { error: "A customer with this email already exists" },
          { status: 400 }
        );
      }
    }

    if (validatedData.taxNumber && validatedData.taxNumber !== customerExists[0].taxNumber) {
      const existingTaxNumber = await db.select()
        .from(customer)
        .where(
          and(
            eq(customer.workspaceId, resolvedWorkspace.id),
            eq(customer.companyId, resolvedCompanyId),
            eq(customer.taxNumber, validatedData.taxNumber),
            isNull(customer.deletedAt)
          )
        )
        .limit(1);

      if (existingTaxNumber.length > 0) {
        return NextResponse.json(
          { error: "A customer with this tax number already exists" },
          { status: 400 }
        );
      }
    }

    // Update the customer
    const updatedCustomer = await db.update(customer)
      .set({
        ...validatedData,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customer.id, customerId),
          eq(customer.workspaceId, resolvedWorkspace.id),
          eq(customer.companyId, resolvedCompanyId)
        )
      )
      .returning();

    return NextResponse.json({
      customer: updatedCustomer[0],
      message: "Customer updated successfully"
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete specific customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, customerId } = await params;

    // Resolve workspace by id or slug
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(
        or(
          eq(workspace.id, workspaceIdOrSlug),
          eq(workspace.slug, workspaceIdOrSlug)
        )
      )
      .limit(1);

    if (foundWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;

    // Try resolve by company id directly in this workspace
    const companyById = await db.select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);

    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      // Fallback: resolve by slug derived from company name (first word)
      const companiesInWorkspace = await db.select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));

      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) {
        resolvedCompanyId = matched.cmp.id;
      }
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: "Company not found in this workspace" },
        { status: 404 }
      );
    }

    const isOwner = resolvedWorkspace.ownerId === session.user.id;
    let userRole = 'owner';
    let userPermissions = null;

    if (!isOwner) {
      // Check if user is a member of this workspace
      const membershipCheck = await db.select({
        role: workspaceMember.role,
        permissions: workspaceMember.permissions,
      })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, resolvedWorkspace.id),
            eq(workspaceMember.userId, session.user.id)
          )
        )
        .limit(1);

      if (membershipCheck.length === 0) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      userRole = membershipCheck[0].role;
      userPermissions = membershipCheck[0].permissions;
    }

    // Check if customer exists
    const customerExists = await db.select()
      .from(customer)
      .where(
        and(
          eq(customer.id, customerId),
          eq(customer.workspaceId, resolvedWorkspace.id),
          eq(customer.companyId, resolvedCompanyId),
          isNull(customer.deletedAt)
        )
      )
      .limit(1);

    if (customerExists.length === 0) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Soft delete the customer
    await db.update(customer)
      .set({
        deletedAt: new Date(),
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customer.id, customerId),
          eq(customer.workspaceId, resolvedWorkspace.id),
          eq(customer.companyId, resolvedCompanyId)
        )
      );

    return NextResponse.json({
      message: "Customer deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
