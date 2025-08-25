import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { customer, workspace, workspaceCompany, company, customerContact } from "@/db/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { slugifyCompanyFirstWord } from "@/lib/slug";
import { nanoid } from "nanoid";

// Validation schema for creating a contact
const createContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().optional().nullable().transform(val => val === '' ? null : val),
  department: z.string().optional().nullable().transform(val => val === '' ? null : val),
  phone: z.string().optional().nullable().transform(val => val === '' ? null : val),
  mobile: z.string().optional().nullable().transform(val => val === '' ? null : val),
  email: z.union([
    z.string().email("Invalid email"),
    z.literal(''),
    z.null()
  ]).optional().transform(val => val === '' ? null : val),
  role: z.string().optional().nullable().transform(val => val === '' ? null : val),
  isPrimary: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
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

    const { customerId } = await params;

    // Get all contacts for this customer
    const contacts = await db.select()
      .from(customerContact)
      .where(
        and(
          eq(customerContact.customerId, customerId),
          isNull(customerContact.deletedAt)
        )
      )
      .orderBy(customerContact.isPrimary, customerContact.firstName);

    return NextResponse.json({
      contacts,
      count: contacts.length
    });

  } catch (error) {
    console.error("Error fetching customer contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new customer contact
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
    
    // Validate the request body
    const validated = createContactSchema.parse(body);

    // Resolve workspace and company, ensure customer ownership
    const foundWorkspace = await db.select()
      .from(workspace)
      .where(or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug)))
      .limit(1);
    
    if (foundWorkspace.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company ID
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
      const matched = companiesInWorkspace.find(({ cmp }) => 
        slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase()
      );
      if (matched) resolvedCompanyId = matched.cmp.id;
    }
    
    if (!resolvedCompanyId) {
      return NextResponse.json({ error: "Company not found in this workspace" }, { status: 404 });
    }

    // Verify customer exists and belongs to this workspace/company
    const customerCheck = await db.select({ id: customer.id })
      .from(customer)
      .where(and(
        eq(customer.id, customerId), 
        eq(customer.workspaceId, resolvedWorkspace.id), 
        eq(customer.companyId, resolvedCompanyId), 
        isNull(customer.deletedAt)
      ))
      .limit(1);
    
    if (customerCheck.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // If setting this contact as primary, unset others for the same customer
    if (validated.isPrimary === true) {
      await db.update(customerContact)
        .set({ isPrimary: false })
        .where(eq(customerContact.customerId, customerId));
    }

    // Create the new contact
    const newContact = await db.insert(customerContact)
      .values({
        id: nanoid(),
        customerId: customerId,
        firstName: validated.firstName,
        lastName: validated.lastName,
        title: validated.title || null,
        department: validated.department || null,
        phone: validated.phone || null,
        mobile: validated.mobile || null,
        email: validated.email || null,
        role: validated.role || null,
        isPrimary: validated.isPrimary || false,
        isActive: validated.isActive !== false,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ 
      contact: newContact[0],
      message: "Contact created successfully" 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating customer contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
