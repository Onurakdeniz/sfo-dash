import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { businessEntity, businessEntityFile, workspaceMember } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { DatabaseErrorHandler } from "@/lib/database-errors";
import { z } from "zod";
import { randomUUID } from "crypto";

// Validation schema for creating files
const fileSchema = z.object({
  name: z.string().min(1, "File name is required").max(255),
  category: z.string().optional().nullable(),
  blobUrl: z.string().min(1, "Blob URL is required"),
  blobPath: z.string().optional().nullable(),
  contentType: z.string().optional().nullable(),
  size: z.number().min(0).default(0),
  description: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({})
});

// GET - List files for a business entity
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
    const category = searchParams.get("category");

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
      eq(businessEntityFile.entityId, entityId),
      isNull(businessEntityFile.deletedAt)
    ];

    if (category) {
      conditions.push(eq(businessEntityFile.category, category));
    }

    // Get files
    const files = await db
      .select()
      .from(businessEntityFile)
      .where(and(...conditions))
      .orderBy(desc(businessEntityFile.createdAt));

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return DatabaseErrorHandler.handle(error);
  }
}

// POST - Create a new file for a business entity
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
    const validatedData = fileSchema.parse(body);

    // Create the file record
    const newFile = await db
      .insert(businessEntityFile)
      .values({
        id: randomUUID(),
        entityId,
        ...validatedData,
        uploadedBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json({
      data: newFile[0],
      message: "File uploaded successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating file:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return DatabaseErrorHandler.handle(error);
  }
}