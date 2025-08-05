import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { companySettings, company, workspace, workspaceCompany, workspaceMember } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    console.log('=== COMPANY SETTINGS GET REQUEST ===');
    const session = await auth.api.getSession({
      headers: await headers()
    });
    console.log('Session:', session?.user ? { id: session.user.id, email: session.user.email } : 'No session');

    if (!session?.user) {
      console.log('Unauthorized request - no session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const workspaceId = searchParams.get('workspaceId');
    console.log('Requested params:', { companyId, workspaceId });

    if (!companyId || !workspaceId) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: "Company ID and Workspace ID are required" }, { status: 400 });
    }

    // Check if workspace exists and user has access
    const workspaceData = await db.select()
      .from(workspace)
      .where(
        eq(workspace.id, workspaceId)
      )
      .limit(1);

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner or a member of this workspace
    const isOwner = workspaceData[0].ownerId === session.user.id;
    
    if (!isOwner) {
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
          { error: "Access denied - not a member of this workspace" },
          { status: 403 }
        );
      }
    }

    // Check if company belongs to workspace
    const companyInWorkspace = await db.select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(workspaceCompany.companyId, companyId)
        )
      )
      .limit(1);

    if (companyInWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Company not found in workspace" },
        { status: 404 }
      );
    }

    // Get company settings
    console.log('Fetching company settings...');
    const settings = await db.select()
      .from(companySettings)
      .where(
        and(
          eq(companySettings.companyId, companyId),
          isNull(companySettings.deletedAt)
        )
      )
      .limit(1);
    console.log('Company settings query result:', settings);

    if (settings.length === 0) {
      console.log('No company settings found, creating default settings...');
      // Create default settings if none exist
      const defaultSettings = {
        id: randomUUID(),
        companyId,
        fiscalYearStart: "01/01",
        taxRate: "18",
        invoicePrefix: "INV",
        invoiceNumbering: "sequential",
        workingHoursStart: null,
        workingHoursEnd: null,
        workingDays: [],
        publicHolidays: [],
        customSettings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('Default company settings to insert:', defaultSettings);

      const insertResult = await db.insert(companySettings).values(defaultSettings).returning();
      console.log('Company settings insert result:', insertResult);
      return NextResponse.json(insertResult[0] || defaultSettings);
    }

    console.log('Returning existing company settings:', settings[0]);
    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      companyId,
      workspaceId,
      fiscalYearStart,
      taxRate,
      invoicePrefix,
      invoiceNumbering,
      workingHoursStart,
      workingHoursEnd,
      workingDays,
      publicHolidays,
      customSettings
    } = body;

    if (!companyId || !workspaceId) {
      return NextResponse.json({ error: "Company ID and Workspace ID are required" }, { status: 400 });
    }

    // Check if workspace exists and user has access
    const workspaceData = await db.select()
      .from(workspace)
      .where(
        eq(workspace.id, workspaceId)
      )
      .limit(1);

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner or a member of this workspace
    const isOwner = workspaceData[0].ownerId === session.user.id;
    
    if (!isOwner) {
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
          { error: "Access denied - not a member of this workspace" },
          { status: 403 }
        );
      }
    }

    // Check if company belongs to workspace
    const companyInWorkspace = await db.select()
      .from(workspaceCompany)
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(workspaceCompany.companyId, companyId)
        )
      )
      .limit(1);

    if (companyInWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Company not found in workspace" },
        { status: 404 }
      );
    }

    // Validate invoice numbering type
    const validNumberingTypes = ["sequential", "yearly", "monthly"];
    if (invoiceNumbering && !validNumberingTypes.includes(invoiceNumbering)) {
      return NextResponse.json(
        { error: "Invalid invoice numbering type" },
        { status: 400 }
      );
    }

    const newSettings = {
      id: randomUUID(),
      companyId,
      fiscalYearStart: fiscalYearStart || "01/01",
      taxRate: taxRate || "18",
      invoicePrefix: invoicePrefix || "INV",
      invoiceNumbering: invoiceNumbering || "sequential",
      workingHoursStart,
      workingHoursEnd,
      workingDays,
      publicHolidays,
      customSettings: customSettings || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(companySettings).values(newSettings).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating company settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('=== COMPANY SETTINGS PATCH REQUEST ===');
    const session = await auth.api.getSession({
      headers: await headers()
    });
    console.log('Session:', session?.user ? { id: session.user.id, email: session.user.email } : 'No session');

    if (!session?.user) {
      console.log('Unauthorized request - no session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const {
      companyId,
      workspaceId,
      fiscalYearStart,
      taxRate,
      invoicePrefix,
      invoiceNumbering,
      workingHoursStart,
      workingHoursEnd,
      workingDays,
      publicHolidays,
      customSettings
    } = body;

    if (!companyId || !workspaceId) {
      return NextResponse.json({ error: "Company ID and Workspace ID are required" }, { status: 400 });
    }

    // Check if workspace exists and user has access
    const workspaceData = await db.select()
      .from(workspace)
      .where(
        eq(workspace.id, workspaceId)
      )
      .limit(1);

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner or a member of this workspace
    const isOwner = workspaceData[0].ownerId === session.user.id;
    
    if (!isOwner) {
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
          { error: "Access denied - not a member of this workspace" },
          { status: 403 }
        );
      }
    }

    // Check if company belongs to workspace
    const companyInWorkspace = await db.select()
      .from(workspaceCompany)
      .where(
        and(
          eq(workspaceCompany.workspaceId, workspaceId),
          eq(workspaceCompany.companyId, companyId)
        )
      )
      .limit(1);

    if (companyInWorkspace.length === 0) {
      return NextResponse.json(
        { error: "Company not found in workspace" },
        { status: 404 }
      );
    }

    // Validate invoice numbering type if provided
    if (invoiceNumbering) {
      const validNumberingTypes = ["sequential", "yearly", "monthly"];
      if (!validNumberingTypes.includes(invoiceNumbering)) {
        return NextResponse.json(
          { error: "Invalid invoice numbering type" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update provided fields
    if (fiscalYearStart !== undefined) updateData.fiscalYearStart = fiscalYearStart;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    if (invoicePrefix !== undefined) updateData.invoicePrefix = invoicePrefix;
    if (invoiceNumbering !== undefined) updateData.invoiceNumbering = invoiceNumbering;
    if (workingHoursStart !== undefined) updateData.workingHoursStart = workingHoursStart;
    if (workingHoursEnd !== undefined) updateData.workingHoursEnd = workingHoursEnd;
    if (workingDays !== undefined) updateData.workingDays = workingDays;
    if (publicHolidays !== undefined) updateData.publicHolidays = publicHolidays;
    if (customSettings !== undefined) updateData.customSettings = customSettings;

    const result = await db.update(companySettings)
      .set(updateData)
      .where(
        and(
          eq(companySettings.companyId, companyId),
          isNull(companySettings.deletedAt)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Company settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating company settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}