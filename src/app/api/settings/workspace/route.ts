import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspaceSettings, workspace, workspaceMember } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  try {
    console.log('=== WORKSPACE SETTINGS GET REQUEST ===');
    const session = await auth.api.getSession({
      headers: await headers()
    });
    console.log('Session:', session?.user ? { id: session.user.id, email: session.user.email } : 'No session');

    if (!session?.user) {
      console.log('Unauthorized request - no session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    console.log('Requested workspaceId:', workspaceId);

    if (!workspaceId) {
      console.log('Missing workspaceId parameter');
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
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

    // Get workspace settings
    console.log('Fetching workspace settings...');
    const settings = await db.select()
      .from(workspaceSettings)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          isNull(workspaceSettings.deletedAt)
        )
      )
      .limit(1);
    console.log('Workspace settings query result:', settings);

    if (settings.length === 0) {
      console.log('No workspace settings found, creating default settings...');
      // Create default settings if none exist
      const defaultSettings = {
        id: randomUUID(),
        workspaceId,
        timezone: "Europe/Istanbul",
        currency: "TRY",
        language: "tr",
        dateFormat: "DD/MM/YYYY",
        workingHoursStart: "09:00",
        workingHoursEnd: "18:00",
        workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        publicHolidays: [],
        customSettings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      console.log('Default settings to insert:', defaultSettings);

      const insertResult = await db.insert(workspaceSettings).values(defaultSettings).returning();
      console.log('Insert result:', insertResult);
      return NextResponse.json(insertResult[0] || defaultSettings);
    }

    console.log('Returning existing workspace settings:', settings[0]);
    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error("Error fetching workspace settings:", error);
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
      workspaceId,
      timezone,
      currency,
      language,
      dateFormat,
      workingHoursStart,
      workingHoursEnd,
      workingDays,
      publicHolidays,
      customSettings
    } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
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

    const newSettings = {
      id: randomUUID(),
      workspaceId,
      timezone: timezone || "Europe/Istanbul",
      currency: currency || "TRY",
      language: language || "tr",
      dateFormat: dateFormat || "DD/MM/YYYY",
      workingHoursStart: workingHoursStart || "09:00",
      workingHoursEnd: workingHoursEnd || "18:00",
      workingDays: workingDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
      publicHolidays: publicHolidays || [],
      customSettings: customSettings || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(workspaceSettings).values(newSettings).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Error creating workspace settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log('=== WORKSPACE SETTINGS PATCH REQUEST ===');
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
      workspaceId,
      timezone,
      currency,
      language,
      dateFormat,
      workingHoursStart,
      workingHoursEnd,
      workingDays,
      publicHolidays,
      customSettings
    } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
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

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only update provided fields
    if (timezone !== undefined) updateData.timezone = timezone;
    if (currency !== undefined) updateData.currency = currency;
    if (language !== undefined) updateData.language = language;
    if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
    if (workingHoursStart !== undefined) updateData.workingHoursStart = workingHoursStart;
    if (workingHoursEnd !== undefined) updateData.workingHoursEnd = workingHoursEnd;
    if (workingDays !== undefined) updateData.workingDays = workingDays;
    if (publicHolidays !== undefined) updateData.publicHolidays = publicHolidays;
    if (customSettings !== undefined) updateData.customSettings = customSettings;

    const result = await db.update(workspaceSettings)
      .set(updateData)
      .where(
        and(
          eq(workspaceSettings.workspaceId, workspaceId),
          isNull(workspaceSettings.deletedAt)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Workspace settings not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error updating workspace settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}