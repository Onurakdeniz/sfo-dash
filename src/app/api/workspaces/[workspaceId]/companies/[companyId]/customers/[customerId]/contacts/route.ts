import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { customer, workspace, workspaceCompany, company, customerContact } from "@/db/schema";
import { eq, and, isNull, or, desc } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";
import { slugifyCompanyFirstWord } from "@/lib/slug";

// Validation schema for contacts
const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  role: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// GET - List customer contacts
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

    // Resolve workspace
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(
        or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug))
      )
      .limit(1);

    if (foundWorkspace.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company within workspace (by id or slugified first word)
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
    if (!resolvedCompanyId) {
      return NextResponse.json({ error: "Company not found in this workspace" }, { status: 404 });
    }

    // Ensure customer belongs to this workspace and company
    const customerCheck = await db.select({ id: customer.id })
      .from(customer)
      .where(and(eq(customer.id, customerId), eq(customer.workspaceId, resolvedWorkspace.id), eq(customer.companyId, resolvedCompanyId), isNull(customer.deletedAt)))
      .limit(1);
    if (customerCheck.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const contacts = await db.select()
      .from(customerContact)
      .where(
        and(
          eq(customerContact.customerId, customerId),
          eq(customerContact.isActive, true),
          isNull(customerContact.deletedAt)
        )
      )
      .orderBy(desc(customerContact.createdAt));

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new contact
export async function POST(
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
    const validatedData = createContactSchema.parse(body);

    // Resolve workspace
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(
        or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug))
      )
      .limit(1);
    if (foundWorkspace.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company in workspace
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
    if (!resolvedCompanyId) {
      return NextResponse.json({ error: "Company not found in this workspace" }, { status: 404 });
    }

    // Ensure customer belongs to this workspace and company
    const customerCheck = await db.select({ id: customer.id })
      .from(customer)
      .where(and(eq(customer.id, customerId), eq(customer.workspaceId, resolvedWorkspace.id), eq(customer.companyId, resolvedCompanyId), isNull(customer.deletedAt)))
      .limit(1);
    if (customerCheck.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Create the contact
    const newContact = await db.insert(customerContact).values({
      id: randomUUID(),
      ...validatedData,
      customerId,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    }).returning();

    return NextResponse.json({
      contact: newContact[0],
      message: "Contact created successfully"
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
