import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, settings } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    if (!slug || slug.trim() === "") {
      return NextResponse.json(
        { error: "Workspace slug is required" },
        { status: 400 }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Slug can only contain lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingWorkspace = await db.select().from(workspace).where(eq(workspace.slug, slug)).limit(1);
    if (existingWorkspace.length > 0) {
      return NextResponse.json(
        { error: "A workspace with this slug already exists" },
        { status: 400 }
      );
    }

    // Generate workspace ID
    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create workspace in database
    const [newWorkspace] = await db.insert(workspace).values({
      id: workspaceId,
      name: name.trim(),
      slug: slug.trim(),
      settings: settings || {},
      ownerId: session.user.id,
    }).returning();

    // Add the creator as a member with owner role
    await db.insert(workspaceMember).values({
      workspaceId: workspaceId,
      userId: session.user.id,
      role: 'owner',
      addedBy: session.user.id,
    });

    return NextResponse.json({
      id: newWorkspace.id,
      name: newWorkspace.name,
      slug: newWorkspace.slug,
      settings: newWorkspace.settings,
      createdAt: newWorkspace.createdAt,
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}