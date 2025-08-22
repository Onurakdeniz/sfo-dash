import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { customer, workspace, workspaceCompany, company, customerContact } from "@/db/schema";
import { eq, and, ne, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { slugifyCompanyFirstWord } from "@/lib/slug";

const updateContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  role: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string; contactId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, customerId, contactId } = await params;
    const body = await request.json();
    const validated = updateContactSchema.parse(body);

    // Resolve workspace and company, ensure customer ownership
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug)))
      .limit(1);
    if (foundWorkspace.length === 0) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    const resolvedWorkspace = foundWorkspace[0];

    let resolvedCompanyId: string | null = null;
    const companyById = await db.select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);
    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      const companiesInWorkspace = await db.select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));
      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) resolvedCompanyId = matched.cmp.id;
    }
    if (!resolvedCompanyId) return NextResponse.json({ error: "Company not found in this workspace" }, { status: 404 });

    const customerCheck = await db.select({ id: customer.id })
      .from(customer)
      .where(and(eq(customer.id, customerId), eq(customer.workspaceId, resolvedWorkspace.id), eq(customer.companyId, resolvedCompanyId), isNull(customer.deletedAt)))
      .limit(1);
    if (customerCheck.length === 0) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // If setting this contact as primary, unset others for the same customer
    if (validated.isPrimary === true) {
      await db.update(customerContact)
        .set({ isPrimary: false })
        .where(and(eq(customerContact.customerId, customerId), ne(customerContact.id, contactId)));
    }

    const updated = await db.update(customerContact)
      .set({
        ...validated,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(and(eq(customerContact.id, contactId), eq(customerContact.customerId, customerId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ contact: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string; contactId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, customerId, contactId } = await params;

    // Resolve workspace/company/customer ensure ownership
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug)))
      .limit(1);
    if (foundWorkspace.length === 0) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    const resolvedWorkspace = foundWorkspace[0];

    let resolvedCompanyId: string | null = null;
    const companyById = await db.select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);
    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      const companiesInWorkspace = await db.select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));
      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) resolvedCompanyId = matched.cmp.id;
    }
    if (!resolvedCompanyId) return NextResponse.json({ error: "Company not found in this workspace" }, { status: 404 });

    const customerCheck = await db.select({ id: customer.id })
      .from(customer)
      .where(and(eq(customer.id, customerId), eq(customer.workspaceId, resolvedWorkspace.id), eq(customer.companyId, resolvedCompanyId), isNull(customer.deletedAt)))
      .limit(1);
    if (customerCheck.length === 0) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const deleted = await db.update(customerContact)
      .set({ isActive: false, deletedAt: new Date(), updatedBy: session.user.id, updatedAt: new Date() })
      .where(and(eq(customerContact.id, contactId), eq(customerContact.customerId, customerId)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


