import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { businessEntity, businessEntityNote, workspaceMember } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { DatabaseErrorHandler } from "@/lib/database-errors";
import { z } from "zod";
import { randomUUID } from "crypto";

// Validation schema for creating notes
const noteSchema = z.object({
  title: z.string().optional().nullable(),
  content: z.string().min(1, "Note content is required"),
  noteType: z.enum(["general", "call", "meeting", "email", "task", "reminder"]).default("general"),
  isInternal: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  relatedContactId: z.string().optional().nullable(),
});

// GET - List notes for a business entity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; entityId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, entityId } = await params;
    const { searchParams } = new URL(request.url);
    const noteType = searchParams.get("noteType");
    const isInternal = searchParams.get("isInternal");

    // Check workspace membership
    const membership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Check if entity exists
    const [entity] = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, entityId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          isNull(businessEntity.deletedAt)
        )
      )
      .limit(1);

    if (!entity) {
      return NextResponse.json({ error: "Business entity not found" }, { status: 404 });
    }

    // Build query conditions
    const conditions = [
      eq(businessEntityNote.entityId, entityId),
      isNull(businessEntityNote.deletedAt)
    ];

    if (noteType) {
      conditions.push(eq(businessEntityNote.noteType, noteType as any));
    }

    if (isInternal !== null) {
      conditions.push(eq(businessEntityNote.isInternal, isInternal === 'true'));
    }

    // Get notes
    const notes = await db
      .select()
      .from(businessEntityNote)
      .where(and(...conditions))
      .orderBy(desc(businessEntityNote.createdAt));

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return DatabaseErrorHandler.handle(error);
  }
}

// POST - Create a new note for a business entity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; entityId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, companyId, entityId } = await params;
    const body = await request.json();

    // Check workspace membership
    const membership = await db
      .select()
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.userId, session.user.id)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
    }

    // Check if entity exists
    const [entity] = await db
      .select()
      .from(businessEntity)
      .where(
        and(
          eq(businessEntity.id, entityId),
          eq(businessEntity.workspaceId, workspaceId),
          eq(businessEntity.companyId, companyId),
          isNull(businessEntity.deletedAt)
        )
      )
      .limit(1);

    if (!entity) {
      return NextResponse.json({ error: "Business entity not found" }, { status: 404 });
    }

    // Validate the request body
    const validatedData = noteSchema.parse(body);

    // Create the note
    const newNote = await db
      .insert(businessEntityNote)
      .values({
        id: randomUUID(),
        entityId,
        ...validatedData,
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json({
      data: newNote[0],
      message: "Note created successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return DatabaseErrorHandler.handle(error);
  }
}